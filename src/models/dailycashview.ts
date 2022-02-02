/**
 * Daily Cash View Model
 */
import * as RestApi from "../lib/restapi";
import * as knex from "knex";
import { Utils } from "../lib/utils";

export class DailyCashView {
    constructor() { }

    public index(args: any, cb: Function) {

    }

    public checkDailyCashType(args: any, cb: Function) {
      RestApi.getDb("daily_cash_type")
        .where("code", args.code)
        .andWhere("id", "!=", args.typeid)
        .select()
        .then((result) => {
          if (result.length > 0)
            cb(undefined, true);
          else
            cb(undefined, false);
        })
        .catch((err) => {
          cb(undefined, {
            error: {
              message: err.message || "Check Error"
            }
          });
        });
    }

    public checkDailyCashInType(args: any, cb: Function) {
      RestApi.getDb("daily_cash_in_type")
        .where("code", args.code)
        .andWhere("id", "!=", args.typeid)
        .select()
        .then((result) => {
          if (result.length > 0)
            cb(undefined, true);
          else
            cb(undefined, false);
        })
        .catch((err) => {
          cb(undefined, {
            error: {
              message: err.message || "Check Error"
            }
          });
        });
    }
}

export default new DailyCashView();