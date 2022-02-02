/**
 * Order Mould View Model
 */
import * as RestApi from "../lib/restapi";
import * as knex from "knex";
import { Utils } from "../lib/utils";

export class OrderMouldView {
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

    public getCode(args: any, cb: Function) {
      const data: any = [{
        "goldsmith_code_id": "",
        "code": "[Select One]"
      }];

      RestApi.getDb("goldsmith_code")
        .where({ "category_id": args.category_id, "wgt_gm": args.wgt_gm, "use_status": "no-use" })
        .whereIn("status", ["order_mould", "divide_mould"])
        .select("id as goldsmith_code_id", "code")
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
              message: err.message || "Get Code Error."
            }
          });
        });
    }

    public getGoldRate(args: any, cb: Function) {
      let data: any = {};

      RestApi.getDb("goldsmith_code")
        .where("id", args.goldsmith_code_id)
        .select("goldrate")
        .first()
        .then((result) => {
          data = result;
          return RestApi.getDb("stock").select().first();
        })
        .then((result) => {
          data.stock = result;
          cb(undefined, data);
        })
        .catch((err) => {
          cb(undefined, {
            error: {
              message: err.message || "Get Goldrate Error."
            }
          });
        });
    }

    public getCodeByGoldsmith(args: any, cb: Function) {
      const data: any = [{
        "goldsmith_code_id": "",
        "code": "[Select One]"
      }];
      RestApi.getDb("goldsmith_code")
        .where({ "goldsmith_id": args.goldsmith_id, "status": "give_goldsmith", "use_status": "no-use" })
        .select("id as goldsmith_code_id", "code")
        .then((result) => {
          if (result.length > 0) {
            result.forEach((item: any) => {
              data.push(item);
            });
          }
          cb(undefined, data);
        })
        .catch((err) => {
          cb(undefined, {
            error: {
              message: err.message || "Get Code Error."
            }
          });
        });
    }

    public getTotalofGive(args: any, cb: Function) {
      let data: any = {};
      RestApi.getDb("give_goldsmith_items")
        .where("goldsmith_code_id", args.goldsmith_code_id)
        .select("total_wgt_gm", "item_id")
        .first()
        .then((result) => {
          data = result;
          cb(undefined, data);
        })
        .catch((err) => {
          cb(undefined, {
            error: {
              message: err.message || "Get Total Gm Error."
            }
          });
        });
    }

    public getGram(args: any, cb: Function) {
      RestApi.getDb("goldsmith_code")
        .where({"status": "first_polish", "use_status": "no-use"})
        .select("wgt_gm")
        .groupBy("wgt_gm")
        .then((result) => {
          cb(undefined, {
            data: result
          });
        })
        .catch((err) => {
          cb(undefined, err);
        });
    }

    public getCategoryByGram(args: any, cb: Function) {
      const data: any = [{
        "category_id": "",
        "category_name": "[Select One]"
      }];
      RestApi.getDb("goldsmith_code")
        .leftJoin("category", "goldsmith_code.category_id", "category.id")
        .where({ "status": "first_polish", "wgt_gm": args.wgt_gm })
        .select("category.id as category_id", "category.category_name")
        .groupBy("category_id", "category_name")
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

    public getCodeByGiveDiamond(args: any, cb: Function) {
      const data: any = [{
        "goldsmith_code_id": "",
        "code": "[Select One]"
      }];

      RestApi.getDb("goldsmith_code")
        .where({ "category_id": args.category_id, "wgt_gm": args.wgt_gm, "status": "first_polish", "use_status": "no-use" })
        .orWhere("id", args.goldsmith_code_id)
        .select("id as goldsmith_code_id", "code")
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
              message: err.message || "Get Code Error."
            }
          });
        });
    }

    public getGiveDiamond(args: any, cb: Function) {
      RestApi.getDb("give_diamond")
        .leftJoin("goldsmith", "give_diamond.goldsmith_id", "goldsmith.id")
        .leftJoin("goldsmith_code", "give_diamond.goldsmith_code_id", "goldsmith_code.id")
        // .where({"status": "give_diamond"})
        .select("give_diamond.*", "goldsmith.goldsmith_name", "goldsmith_code.code", "goldsmith_code.status")
        .orderBy("give_diamond.date", "desc")
        .then((result) => {
          cb(undefined, {
            data: result
          });
        })
        .catch((err) => {
          cb(undefined, {
            error: {
              message: err.message || "Get Diamond Error."
            }
          });
        });
    }

  public getCodeFromFirstPolish(args: any, cb: Function) {
    RestApi.getDb("goldsmith_code")
      .where({ "status": "get_goldsmith", "use_status": "no-use" })
      .orWhere("id", args.id)
      .select()
      .then((result) => {
        cb(undefined, {
          data: result
        });
      })
      .catch((err) => {
        cb(undefined, {
          error: {
            message: err.message || "Get Code Error."
          }
        });
      });
  }

  public getwgtFromGetGoldsmith(args: any, cb: Function) {
    let data: any = {};
    RestApi.getDb("get_goldsmith")
      .leftJoin("goldsmith_code", "get_goldsmith.goldsmith_code_id", "goldsmith_code.id")
      .where("goldsmith_code_id", args.goldsmith_code_id)
      .select("get_goldsmith.wgt_gm", "goldsmith_code.goldrate")
      .first()
      .then((result) => {
        data = result;
        cb(undefined, data);
      })
      .catch((err) => {
        cb(undefined, {
          error: {
            message: err.message || "Get Total Gm Error."
          }
        });
      });
  }

  public getItemByGoldsmithCode(args: any, cb: Function) {
    RestApi.getDb("goldsmith_code")
      .where("id", args.id)
      .select()
      .first()
      .then((result) => {
        cb(undefined, result);
      })
      .catch((err) => {
        cb(undefined, {
          error: {
            message: err.message || "Get Item Error."
          }
        });
      });
  }
}

export default new OrderMouldView();