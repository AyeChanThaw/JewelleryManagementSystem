/**
 * Settlement View Model
 */
import * as RestApi from "../lib/restapi";
import * as knex from "knex";
import { Utils } from "../lib/utils";

export class SettlementView {
    constructor() { }

    public index(args: any, cb: Function) {
        RestApi.getDb("settlement")
            .select("settlement.*", "supplier.supplier_name", "whole_diamond.voc_no as wholediamond")
            .leftJoin("supplier", "settlement.supplier_id", "supplier.id")
            .leftJoin("whole_diamond", "settlement.wholediamond_id", "whole_diamond.id")
            .orderBy("settlement.date", "desc")
            .then((result) => {
                cb(undefined, {
                    settlement: result
                });
            })
            .catch((err) => {
                cb(undefined, err);
            });

    }

    public getDiamondSettlement(args: any, cb: Function) {
        RestApi.getDb("diamond_settlement")
            .leftJoin("supplier", "supplier_id", "supplier.id")
            .leftJoin("whole_diamond", "wholediamond_id", "whole_diamond.id")
            .orderBy("diamond_settlement.date", "desc")
            .select("diamond_settlement.*", "supplier.supplier_name", "whole_diamond.voc_no as wholediamond")
            .then((result) => {
                cb(undefined, {
                    data: result
                });
            })
            .catch((err) => {
                cb(undefined, err);
            });
    }

    public getCustomerSettlement(args: any, cb: Function) {
        RestApi.getKnex().raw(`SELECT customer_settlement.*, customer.customer_name, IF(customer_debt.sale_diamond_id = '', sale_gold.voc_no, sale_diamond.voc_no) AS voc_no
                FROM customer_settlement
                LEFT JOIN customer ON customer_id = customer.id
                LEFT JOIN customer_debt ON customer_debt_id = customer_debt.id
                LEFT JOIN sale_diamond ON customer_debt.sale_diamond_id = sale_diamond.id
                LEFT JOIN sale_gold ON customer_debt.sale_gold_id = sale_gold.id
                ORDER BY customer_settlement.date DESC`)
        // RestApi.getDb("customer_settlement")
        //     .leftJoin("customer", "customer_id", "customer.id")
        //     .leftJoin("whole_diamond", "wholediamond_id", "whole_diamond.id")
        //     .orderBy("customer_settlement.date", "desc")
        //     .select("customer_settlement.*", "customer.customer_name", "whole_diamond.voc_no as wholediamond")
            .then((result) => {
                cb(undefined, {
                    data: result[0]
                });
            })
            .catch((err) => {
                cb(undefined, err);
            });
    }
}

export default new SettlementView();