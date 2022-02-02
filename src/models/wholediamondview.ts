/**
 * WholeDiamond View Model
 */
import * as RestApi from "../lib/restapi";
import * as knex from "knex";
import { Utils } from "../lib/utils";

export class WholeDiamondView {
    constructor() { }

    public index(args: any, cb: Function) {
        RestApi.getDb("whole_diamond")
            .select("whole_diamond.*", "supplier.supplier_name", "gemtype.gemtype", "diamondtype.diamondtype")
            .leftJoin("supplier", "whole_diamond.supplier_id", "supplier.id")
            .leftJoin("gemtype", "whole_diamond.gemtype_id", "gemtype.id")
            .leftJoin("diamondtype", "whole_diamond.diamondtype_id", "diamondtype.id")
            .orderBy("date", "desc")
            .then((result) => {
                cb(undefined, {
                    whole_diamond: result
                });
            })
            .catch((err) => {
                cb(undefined, err);
            });

    }

    public getWholeDiamondWithID(args: any, cb: Function) {
      RestApi.getDb("whole_diamond")
        .leftJoin("gemtype", "whole_diamond.gemtype_id", "gemtype.id")
        .where("whole_diamond.id", args.id)
        .select("whole_diamond.*", "gemtype.gemtype")
        .first()
        .then((result) => {
          cb(undefined, result);
        })
        .catch((err) => {
          cb(undefined, err);
        });
    }

    public getDiamond(args: any, cb: Function) {
        RestApi.getDb("diamond")
            .leftJoin("whole_diamond", "diamond.wholediamond_id", "whole_diamond.id")
            .leftJoin("gemtype", "diamond.gemtype_id", "gemtype.id")
            .select("diamond.id", "gemtype.gemtype", "whole_diamond.code as wd_code", "diamond.remark", "diamond.isfinished", "diamond.createddate")
            .orderBy("createddate", "desc")
            .then((result) => {
                cb(undefined, {
                    diamond: result
                });
            })
            .catch((err) => {
                cb(undefined, err);
            });
    }

    public getPrefixByGemType(args: any, cb: Function) {
      RestApi.getDb("gemtype")
        .where("id", args.gemtype_id)
        .select()
        .first()
        .then((result) => {
          cb(undefined, {
            data: result
          });
        })
        .catch((err) => {
          cb(undefined, err);
        });
    }

    public getDiamondItems(args: any, cb: Function) {
      const data: any = [{
        "diamond_id": "",
        "code": "[Select One]"
      }];

      RestApi.getDb("diamond_items")
        .where("wholediamond_id", args.wholediamond_id)
        .andWhere("current_qty", ">", 0)
        .select("id as diamond_id", "code")
        .then((result) => {
          if (result.length > 0) {
            result.forEach((item) => {
              data.push(item);
            });
          }
          cb(undefined, data);
        })
        .catch((err) => {
          cb(undefined, err);
        });
    }

    public getQtyByDiamond(args: any, cb: Function) {
      RestApi.getDb("diamond_items")
        .where("id", args.diamond_id)
        .select("current_qty")
        .first()
        .then((result) => {
          cb(undefined, {
            data: result
          });
        })
        .catch((err) => {
          cb(undefined, err);
        });
    }

    public getWholeDiamond(args: any, cb: Function) {
      const data: any = [{
        "id": "",
        "code": "[Select One]"
      }];
      RestApi.getDb("diamond_items")
        .leftJoin("whole_diamond", "diamond_items.wholediamond_id", "whole_diamond.id")
        .leftJoin("diamond", "diamond_items.diamond_id", "diamond.id")
        .where("diamond_items.current_qty", ">", 0)
        .andWhere("diamond.isfinished", 1)
        .groupBy("diamond_items.wholediamond_id")
        .select("whole_diamond.id", "whole_diamond.code")
        .then((result) => {
          if (result.length > 0) {
            result.forEach((item) => {
              data.push(item);
            });
          }
          cb(undefined, data);
        })
        .catch((err) => {
          cb(undefined, err);
        });
    }
}

export default new WholeDiamondView();