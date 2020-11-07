import { DocRejectionReason } from 'src/common/enum';
import { docRejectionReasonMaxLength } from 'src/common/field-length';
import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    JoinColumn,
    OneToOne,
    DeleteDateColumn,
    CreateDateColumn,
} from 'typeorm';
import { Document } from './document.entity';

@Entity()
export class InvalidDocument {
    @PrimaryGeneratedColumn()
    id?: number;

    @OneToOne(
        type => Document,
        {
            // Can't use as part of composite primary key without this.
            nullable: false,
        }
    )
    @JoinColumn({
        name: "id",
        referencedColumnName: "id",
    })
    document: Document;

    @CreateDateColumn()
    createdOn?: Date;

    @DeleteDateColumn()
    deletedOn?: Date;

    @Column({ type: "smallint" })
    reason: DocRejectionReason;

    @Column("varchar", { nullable: true, length: docRejectionReasonMaxLength })
    description: string;
}
