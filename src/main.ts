import {TypeormDatabase} from '@subsquid/typeorm-store'
import {processor, CONTRACT_ADDRESS, Context} from './processor'
import * as bayc from './abi/bayc'
import {Transfer, Owner, Token} from './model'
import {TokenMetadata, fetchTokenMetadata} from './metadata'

processor.run(new TypeormDatabase(), async (ctx) => {
    let rawTransfers: RawTransfer[] = getRawTransfers(ctx)

    let owners: Map<string, Owner> = createOwners(rawTransfers)
    let tokens: Map<string, Token> = await createTokens(ctx, rawTransfers, owners)
    let transfers: Transfer[] = createTransfers(rawTransfers, owners, tokens)

    await ctx.store.upsert([...owners.values()])
    await ctx.store.upsert([...tokens.values()])
    await ctx.store.insert(transfers)
})

interface RawTransfer {
    id: string
    tokenId: bigint
    from: string
    to: string
    timestamp: Date
    blockNumber: number
    txHash: string
}

function getRawTransfers(ctx: Context): RawTransfer[] {
    let transfers: RawTransfer[] = []

    for (let block of ctx.blocks) {
        for (let log of block.logs) {
            if (log.address === CONTRACT_ADDRESS && log.topics[0] === bayc.events.Transfer.topic) {
                let {from, to, tokenId} = bayc.events.Transfer.decode(log)
                transfers.push({
                    id: log.id,
                    tokenId,
                    from,
                    to,
                    timestamp: new Date(block.header.timestamp),
                    blockNumber: block.header.height,
                    txHash: log.transactionHash,
                })
            }
        }
    }

    return transfers
}

function createOwners(rawTransfers: RawTransfer[]): Map<string, Owner> {
    let owners: Map<string, Owner> = new Map()
    for (let t of rawTransfers) {
        owners.set(t.from, new Owner({id: t.from}))
        owners.set(t.to, new Owner({id: t.to}))
    }
    return owners
}

async function createTokens(
    ctx: Context,
    rawTransfers: RawTransfer[],
    owners: Map<string, Owner>
): Promise<Map<string, Token>> {

    let tokens: Map<string, PartialToken> = new Map()
    for (let t of rawTransfers) {
        let tokenIdString = `${t.tokenId}`
        let ptoken: PartialToken = {
            id: tokenIdString,
            tokenId: t.tokenId,
            owner: owners.get(t.to)!
        }
        tokens.set(tokenIdString, ptoken)
    }
    return await completeTokens(ctx, tokens)
}

interface PartialToken {
    id: string
    tokenId: bigint
    owner: Owner
}

async function completeTokens(
    ctx: Context,
    partialTokens: Map<string, PartialToken>
): Promise<Map<string, Token>> {

    let tokens: Map<string, Token> = new Map()
    if (partialTokens.size === 0) return tokens

    let lastBatchBlockHeader = ctx.blocks[ctx.blocks.length-1].header
    let contract = new bayc.Contract(ctx, lastBatchBlockHeader, CONTRACT_ADDRESS)

    for (let [id, ptoken] of partialTokens) {
        let uri = await contract.tokenURI(ptoken.tokenId)
        ctx.log.info(`Retrieved metadata URI ${uri}`)
        let metadata: TokenMetadata | undefined = await fetchTokenMetadata(ctx, uri)
        tokens.set(id, new Token({
            ...ptoken,
            uri,
            ...metadata
        }))
    }

    return tokens
}

function createTransfers(
    rawTransfers: RawTransfer[],
    owners: Map<string, Owner>,
    tokens: Map<string, Token>
): Transfer[] {

    return rawTransfers.map(t => new Transfer({
        id: t.id,
        token: tokens.get(`${t.tokenId}`),
        from: owners.get(t.from),
        to: owners.get(t.to),
        timestamp: t.timestamp,
        blockNumber: t.blockNumber,
        txHash: t.txHash
    }))
}
