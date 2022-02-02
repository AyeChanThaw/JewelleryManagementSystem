/**
 * Debt View Model
 */
import * as RestApi from "../lib/restapi";
import * as knex from "knex";
import { Utils } from "../lib/utils";

export class DebtView {
    constructor() { }

    public index(args: any, cb: Function) {
        RestApi.getDb("debt")
            .select("debt.*", "supplier.supplier_name", "purchase.voc_no", "purchase_gold.voc_no", "purchase_pt.voc_no", "status")
            .leftJoin("supplier", "debt.supplier_id", "supplier.id")
            .leftJoin("purchase", "parent_id", "purchase.id")
            .leftJoin("purchase_gold", "parent_id", "purchase_gold.id")
            .leftJoin("purchase_pt", "parent_id", "purchase_pt.id")
            .where("balance", ">", 0)
            // .leftJoin("goldraw", "debt.goldraw_id", "goldraw.id")
            .then((result) => {
                cb(undefined, {
                    debt: result
                });
            })
            .catch((err) => {
                cb(undefined, err);
            });

    }

    public getCustomerDebt(args: any, cb: Function) {
      RestApi.getKnex()
        .raw(`SELECT customer_debt.date, customer.customer_name, customer_debt.balance AS amount, IF(sale_diamond_id = "", sale_gold.voc_no, sale_diamond.voc_no) AS voc_no
                FROM customer_debt
                LEFT JOIN customer ON customer_id = customer.id
                LEFT JOIN sale_diamond ON sale_diamond_id = sale_diamond.id
                LEFT JOIN sale_gold ON sale_gold_id = sale_gold.id
                WHERE balance > 0
              `)
        .then((result) => {
          if (result[0].length > 0) {
            result[0].forEach((debt: any) => {
              debt.amount = Utils.addComma(debt.amount);
            });
          }
          cb(undefined, {
            data: result[0]
          });
        })
        .catch((err) => {
          cb(undefined, err);
        });
  }

    public getDebtBySupplier(args: any, cb: Function) {
        RestApi.getKnex()
          .raw(`SELECT debt.currency, debt.balance AS amount, debt.id AS debt_id, supplier.supplier_name, debt.wholediamond_id AS wholediamond_id, debt.purchase_id AS purchase_id, IF(wholediamond_id IS NULL, purchase.voc_no, whole_diamond.voc_no) AS voc_no
                FROM debt
                LEFT JOIN supplier ON supplier_id = supplier.id
                LEFT JOIN whole_diamond ON wholediamond_id = whole_diamond.id
                LEFT JOIN purchase ON purchase_id = purchase.id
                WHERE debt.supplier_id = '` + args.supplier_id + `' AND debt.balance > 0
                `)
          .then((result) => {
            if (result[0].length > 0) {
              result[0].forEach((debt: any) => {
                debt.amount = Utils.addComma(debt.amount);
              });
            }
            cb(undefined, {
              data: result[0]
            });
          })
          .catch((err) => {
            cb(undefined, err);
          });
        // RestApi.getDb("debt")
        //     .select("debt.currency", "debt.balance as amount", "debt.id as debt_id", "supplier.supplier_name", "whole_diamond.voc_no", "whole_diamond.id as wholediamond_id", "purchase.id as purchase_id", "purchase.voc_no")
        //     .leftJoin("supplier", "debt.supplier_id", "supplier.id")
        //     .leftJoin("whole_diamond", "debt.wholediamond_id", "whole_diamond.id")
        //     .leftJoin("purchase", "purchase_id", "purchase.id")
        //     .where("debt.supplier_id", args.supplier_id)
        //     .andWhere("debt.balance", ">", 0)
    }

    public getDiamondDebtBySupplier(args: any, cb: Function) {
      RestApi.getDb("diamond_debt")
        .leftJoin("supplier", "supplier_id", "supplier.id")
        .leftJoin("whole_diamond", "wholediamond_id", "whole_diamond.id")
        .where("diamond_debt.supplier_id", args.supplier_id)
        .andWhere("diamond_debt.balance", ">", 0)
        .select("diamond_debt.balance as amount", "diamond_debt.id as diamond_debt_id", "diamond_debt.wholediamond_id", "diamond_debt.debt_carat", "supplier.supplier_name", "whole_diamond.voc_no")
        .then((result) => {
          if (result.length > 0) {
            result.forEach((diamond_debt: any) => {
              diamond_debt.amount = Utils.addComma(diamond_debt.amount);
            });
          }
          cb(undefined, {
            data: result
          });
        })
        .catch((err) => {
          cb(undefined, err);
        });
    }

    public getDebtCustomer(args: any, cb: Function) {
      RestApi.getDb("customer_debt")
        .leftJoin("customer", "customer_id", "customer.id")
        .where("balance", ">", 0)
        .distinct("customer_debt.customer_id as id", "customer.customer_name")
        .then((result) => {
          cb(undefined, {
            data: result
          });
        })
        .catch((err) => {
          cb(undefined, err);
        });
    }

    public getCustomerDebtByCustomer(args: any, cb: Function) {
      RestApi.getKnex().raw(`SELECT customer_debt.balance AS amount, customer_debt.id AS customer_debt_id, IF(sale_diamond_id = '', sale_gold.voc_no, sale_diamond.voc_no) AS voc_no FROM customer_debt
          LEFT JOIN customer ON customer_id = customer.id
          LEFT JOIN sale_diamond ON sale_diamond_id = sale_diamond.id
          LEFT JOIN sale_gold ON sale_gold_id = sale_gold.id
          WHERE customer_debt.customer_id = '` + args.customer_id + `' AND balance > 0`)
        .then((result) => {
          if (result[0].length > 0) {
            result[0].forEach((customer_debt: any) => {
              customer_debt.amount = Utils.addComma(customer_debt.amount);
            });
          }
          cb(undefined, {
            data: result[0]
          });
        })
        .catch((err) => {
          cb(undefined, err);
        });
    }
}

export default new DebtView();