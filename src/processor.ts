import {lookupArchive} from '@subsquid/archive-registry'
import {
    BlockHeader,
    DataHandlerContext,
    EvmBatchProcessor,
    EvmBatchProcessorFields,
    Log as _Log,
    Transaction as _Transaction,
} from '@subsquid/evm-processor'
import {Store} from '@subsquid/typeorm-store'
import * as bayc from './abi/bayc'

export const CONTRACT_ADDRESS = '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d'

export const processor = new EvmBatchProcessor()
    .setDataSource({
        archive: lookupArchive('eth-mainnet'),
        chain: 'https://eth-rpc.gateway.pokt.network'
    })
    .setFinalityConfirmation(75)
    .setBlockRange({
        from: 12_287_507,
    })
    .addLog({
        address: [CONTRACT_ADDRESS],
        topic0: [bayc.events.Transfer.topic]
    })
    .setFields({
        log: {
            transactionHash: true
        }
    })

export type Fields = EvmBatchProcessorFields<typeof processor>
export type Context = DataHandlerContext<Store, Fields>
export type Block = BlockHeader<Fields>
export type Log = _Log<Fields>
export type Transaction = _Transaction<Fields>
