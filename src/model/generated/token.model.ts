import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, ManyToOne as ManyToOne_, Index as Index_, OneToMany as OneToMany_} from "typeorm"
import {Owner} from "./owner.model"
import {Transfer} from "./transfer.model"

@Entity_()
export class Token {
    constructor(props?: Partial<Token>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @Column_("int4", {nullable: false})
    tokenId!: number

    @Index_()
    @ManyToOne_(() => Owner, {nullable: true})
    owner!: Owner

    @OneToMany_(() => Transfer, e => e.token)
    transfers!: Transfer[]
}
