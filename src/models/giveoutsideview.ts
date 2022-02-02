/**
 * Give Outside View Model
 */
import * as RestApi from "../lib/restapi";
import * as knex from "knex";
import { Utils } from "../lib/utils";

export class GiveOutsideView {
    constructor() { }

    public index(args: any, cb: Function) {
        RestApi.getDb("item")
            .select("item.*", "category.category_name")
            .leftJoin("category", "item.category_id", "category.id")
            .then((result) => {
                cb(undefined, {
                    item: result
                });
            })
            .catch((err) => {
                cb(undefined, err);
            });

    }

    public getGoldsmith(args: any, cb: Function) {
      RestApi.getDb("give_outside")
        .leftJoin("goldsmith", "goldsmith_id", "goldsmith.id")
        .select("goldsmith.id", "goldsmith.goldsmith_name")
        .groupBy("goldsmith_id")
        .then((result) => {
          cb(undefined, {
              data: result
          });
        })
        .catch((err) => {
          cb(undefined, {
            error: {
              message: err.message || "Get Goldsmith Error."
            }
          });
        });
    }

    public getGiveOutsideItem(args: any, cb: Function) {
        const data: any = [{
            "id": "",
            "code": "[Select One]"
        }];
        RestApi.getDb("give_outside_items")
            .leftJoin("give_outside", "give_outside_id", "give_outside.id")
            .where({"give_outside.goldsmith_id": args.goldsmith_id, "give_outside_items.is_stock": 1, "status": "no-use"})
            .select("give_outside_items.*")
            .then((result) => {
                if (result.length > 0) {
                    result.forEach((item) => {
                      data.push(item);
                    });
                }
                cb(undefined, data);
            })
            .catch((err) => {
                cb(undefined, {
                    error: {
                        message: err.message || "Get Give Outside Items Error."
                    }
                });
            });
    }

    public giveOutside(args: any, cb: Function) {
        RestApi.getDb("get_outside")
            .leftJoin("goldsmith", "goldsmith_id", "goldsmith.id")
            .leftJoin("item", "item_id", "item.id")
            .leftJoin("give_outside_items", "give_outside_item_id", "give_outside_items.id")
            .select("get_outside.*", "goldsmith.goldsmith_name", "give_outside_items.code")
            .orderBy("get_outside.date", "desc")
            .then((result) => {
                cb(undefined, {
                    data: result
                });
            })
            .catch((err) => {
                cb(undefined, {
                    error: {
                        message: err.message || "Give Outside Error."
                    }
                });
            });
    }
}

export default new GiveOutsideView();