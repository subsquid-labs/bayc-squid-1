import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, Index as Index_} from "typeorm"
import * as marshal from "./marshal"

@Entity_()
export class Transfer {
    constructor(props?: Partial<Transfer>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @Index_()
    @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
    tokenId!: bigint

    @Index_()
    @Column_("text", {nullable: false})
    from!: string

    @Index_()
    @Column_("text", {nullable: false})
    to!: string

    @Column_("timestamp with time zone", {nullable: false})
    timestamp!: Date

    @Column_("int4", {nullable: false})
    blockNumber!: number

    @Index_()
    @Column_("text", {nullable: false})
    txHash!: string
}
