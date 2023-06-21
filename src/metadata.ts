import path from 'path'
import https from 'https'
import axios from 'axios'
import assert from 'assert'

import { Context } from './processor'
import { Token, Attribute } from './model'
import { asyncSleep, splitIntoBatches } from './util'

const MAX_REQ_SEC = 10
const IPFS_GATEWAY = 'https://ipfs.io/ipfs/'

export interface TokenMetadata {
    image: string
    attributes: Attribute[]
}

export async function selectivelyUpdateMetadata(
    ctx: Context,
    tokens: Token[],
    newTokenURIs: string[]
): Promise<Token[]> {

    assert(tokens.length === newTokenURIs.length)
    let updatedTokens: Token[] = []
    let tokensToBeUpdated: Token[] = []
    for (let [i, t] of tokens.entries()) {
        if (t.image != null && t.attributes != null &&
            t.uri === newTokenURIs[i] && uriPointsToImmutable(t.uri)) {

            ctx.log.info(`Repeated retrieval from ${t.uri} skipped`)
            updatedTokens.push(t)
        }
        else {
            t.uri = newTokenURIs[i]
            ctx.log.info(`Re-retrieving from ${t.uri}`)
            tokensToBeUpdated.push(t)
        }
    }

    let metadatas: (TokenMetadata | undefined)[] = await fetchTokenMetadatasConcurrently(
        ctx,
        tokensToBeUpdated.map(t => t.uri!)
    )

    for (let [i, t] of tokensToBeUpdated.entries()) {
        let m = metadatas[i]
        if (m != null) {
            t.image = m.image
            t.attributes = m.attributes
        }
        updatedTokens.push(t)
    }

    return updatedTokens
}


function uriPointsToImmutable(uri: string | null | undefined): boolean {
    return (uri != null) && uri.startsWith('ipfs://') && !uri.includes('ipns')
}

async function fetchTokenMetadatasConcurrently(
    ctx: Context,
    uris: string[]
): Promise<(TokenMetadata | undefined)[]> {

    let metadatas: (TokenMetadata | undefined)[] = []
    for (let batch of splitIntoBatches(uris, MAX_REQ_SEC)) {
        let m = await Promise.all(batch.map((uri, index) => {
            // spread out the requests evenly within a second interval
            let sleepMs = Math.ceil(1000*(index+1)/MAX_REQ_SEC)
            return asyncSleep(sleepMs).then(() => fetchTokenMetadata(ctx, uri))
        }))
        metadatas.push(...m)
    }
    return metadatas
}

async function fetchTokenMetadata(ctx: Context, uri: string): Promise<TokenMetadata | undefined> {
    try {
        if (uri.startsWith('ipfs://')) {
            const gatewayURL = path.posix.join(IPFS_GATEWAY, ipfsRegExp.exec(uri)![1])
            let res = await client.get(gatewayURL)
            ctx.log.info(`Successfully fetched metadata from ${gatewayURL}`)
            return res.data
        } else if (uri.startsWith('http://') || uri.startsWith('https://')) {
            let res = await client.get(uri)
            ctx.log.info(`Successfully fetched metadata from ${uri}`)
            return res.data
        } else {
            ctx.log.warn(`Unexpected metadata URL protocol: ${uri}`)
            return undefined
        }
    } catch (e) {
        throw new Error(`Failed to fetch metadata at ${uri}. Error: ${e}`)
    }
}

const ipfsRegExp = /^ipfs:\/\/(.+)$/

const client = axios.create({
    headers: {'Content-Type': 'application/json'},
    httpsAgent: new https.Agent({keepAlive: true}),
    transformResponse(res: string): TokenMetadata {
        let data: {image: string; attributes: {trait_type: string; value: string}[]} = JSON.parse(res)
        return {
            image: data.image,
            attributes: data.attributes.map((a) => new Attribute({traitType: a.trait_type, value: a.value})),
        }
    },
})
