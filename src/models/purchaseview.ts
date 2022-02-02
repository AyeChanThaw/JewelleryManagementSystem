/**
 * Purchase View Model
 */
import * as RestApi from "../lib/restapi";
import * as knex from "knex";
import { Utils } from "../lib/utils";

export class PurchaseView {
    constructor() { }

    public index(args: any, cb: Function) {
        const data: any = {
        data: []
        };

        RestApi.getDb("purchase")
            .select()
            .then((result) => {
                cb(undefined, result);
            })
            .catch((err) => {
                cb(undefined, err);
            });

    }

    public getPurchase(args: any, cb: Function) {
        const sale: any = {};
        RestApi.getKnex().raw("select purchase.id, purchase.purchase_date, purchase.voc_no, purchase.ref_no, purchase.gold_total, purchase.brass_total, purchase.silver_total, purchase.mo_total, purchase.finished, user.username from purchase left join user on user.id=purchase.cashier_id order by purchase_date desc")
            .then((result) => {
                cb(undefined,
                    { data: result[0] }
                    );
            })
            .catch((err) => {
                cb(undefined, err);
            });
    }

    public getMouldCode(args: any, cb: Function) {
      RestApi.getDb("purchase")
        .where("mo_gm_balance", ">", 0)
        .andWhere("finished", "Yes")
        .orWhere("id", args.id)
        .select()
        .then((result) => {
          cb(undefined, {
            data: result
          });
        })
        .catch((err) => {
          cb(undefined, err);
        });
    }

    public getWgt(args: any, cb: Function) {
      RestApi.getDb("purchase")
        .where("id", args.purchase_id)
        .select()
        .first()
        .then((result) => {
          cb(undefined, result);
        })
        .catch((err) => {
          cb(undefined, err);
        });
    }
}

export default new PurchaseView();