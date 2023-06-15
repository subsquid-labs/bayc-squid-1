import {TypeormDatabase} from '@subsquid/typeorm-store'
import {processor, CONTRACT_ADDRESS} from './processor'
import * as bayc from './abi/bayc'
import {Transfer} from './model'

processor.run(new TypeormDatabase(), async (ctx) => {
    let transfers: Transfer[] = []

    for (let block of ctx.blocks) {
        for (let log of block.logs) {
            if (log.address === CONTRACT_ADDRESS && log.topics[0] === bayc.events.Transfer.topic) {
                let {from, to, tokenId} = bayc.events.Transfer.decode(log)
                transfers.push(new Transfer({
                    id: log.id,
                    tokenId,
                    from,
                    to,
                    timestamp: new Date(block.header.timestamp),
                    blockNumber: block.header.height,
                    txHash: log.transactionHash,
                }))
            }
        }
    }

    await ctx.store.insert(transfers)
})
