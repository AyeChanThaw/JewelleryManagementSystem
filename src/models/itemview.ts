/**
 * Item View Model
 */
import * as RestApi from "../lib/restapi";
import * as knex from "knex";
import * as uuid from "uuid";
import { Utils } from "../lib/utils";

export class ItemView {
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

    public itemList(args: any, cb: Function) {

      // RestApi.getKnex().raw(`SELECT item.*, category.category_name, grade.grade_name from item
      //                         LEFT JOIN category ON category_id = category.id
      //                         LEFT JOIN grade ON grade_id = grade.id
      //                         WHERE DATE > '2021-01-01' AND is_stock = 1 AND is_sale = 0
      // `)
      RestApi.getDb("item")
        .leftJoin("category", "category_id", "category.id")
        .leftJoin("grade", "grade_id", "grade.id")
        .where({ "is_stock": 1, "is_sale": 0 } )
        .andWhere("date", )
        .select("item.*", "category.category_name", "grade.grade_name")
        .then((result) => {
          cb(undefined, {
            data: result
          });
        })
        .catch((err) => {
          cb(undefined, {
            error: {
              message: err.message || "Get Item List Error."
            }
          });
        });
    }

    public itemDataList(args: any, cb: Function) {
      RestApi.getDb("item")
        .leftJoin("category", "category_id", "category.id")
        .leftJoin("grade", "grade_id", "grade.id")
        .where({ "is_stock": 1, "is_sale": 0, "is_entry": 1} )
        .select("item.*", "category.category_name", "grade.grade_name")
        .then((result) => {
          cb(undefined, {
            data: result
          });
        })
        .catch((err) => {
          cb(undefined, {
            error: {
              message: err.message || "Get Item List Error."
            }
          });
        });
    }

    public getItemWithSearch(args: any, cb: Function) {
      const data: any = {
          success: true,
          data: []
      };
      const search = args.search;
      let dbQuery = RestApi.getDb("item")
        .where("is_stock", 1)
        .select("item.*", "category.category_name")
        .leftJoin("category", "item.category_id", "category.id")
        .where({"is_stock": 1, "is_sale": 0});
      if (args.category_id && args.category_id != "")
        dbQuery = dbQuery.andWhere("category_id", args.category_id);
      if (search && search != "") {
          dbQuery = dbQuery.andWhere(function() {
              this.where("code", "like", "%" + search + "%")
                  .orWhere("category_name", "like", "%" + search + "%")
                  .orWhere("item_name", "like", "%" + search + "%");
                  // .orWhere("price", search);
          });
      }
      dbQuery.orderBy("date", "desc")
        .then((result) => {
          console.log("data ", result);
          data.data = result;
          return RestApi.getDb("goldrate_price").orderBy("updateddate", "desc").select().first();
        })
        .then((result) => {
          data.goldrate_price = result;
          console.log("data ", data);
          cb(undefined, data);
        })
        .catch((err) => {
          cb(undefined, {
            success: false,
            errors: {
              message: err.message || "Search Error."
            }
          });
        });
    }

    public getItemById(args: any, cb: Function) {
      const data: any = {
        success: true,
        data: {}
      };
      RestApi.getDb("item")
        .where("id", args.id)
        .first()
        .then((result) => {
          let goldrate = "";
          if (result && result != "") {
            if (result.goldrate == "a") {
              goldrate = "၁၆ ပဲရည်";
            } else if (result.goldrate == "b") {
              goldrate = "၁၅ ပဲရည်";
            } else if (result.goldrate == "c") {
              goldrate = "၁၄ ပဲရည်";
            } else if (result.goldrate == "d") {
              goldrate = "၁၃ ပဲရည်";
            }
            result.goldrate = goldrate;
          }
          data.data = result;
          cb(undefined, data);
        })
        .catch((err) => {
          cb(undefined, {
            success: false,
            errors: {
              message: err.message || "Search Error."
            }
          });
        });
    }

    public getGoldItem(args: any, cb: Function) {
      let current_rate: any;
      let data: any = {};
      RestApi.getDb("item")
        .where({"id": args.id})
        .select()
        .first()
        .then((result) => {
          data = result;
          return RestApi.getDb("goldrate_price").orderBy("createddate", "desc").select().first();
        })
        .then((result) => {
          if (data.goldrate == "a")
            current_rate = result.a;
          else if (data.goldrate == "b")
            current_rate = result.b;
          else if (data.goldrate == "c")
            current_rate = result.c;
          else if (data.goldrate == "d")
            current_rate = result.d;
          data.current_rate = current_rate;
          // data.price = Utils.calc_gold_amount(data.wgt_gm, current_rate);
          cb(undefined, data);
        })
        .catch((err) => {
          cb(undefined, {
            error: {
              message: err.message || "Search Error."
            }
          });
        });
    }

    public getCodeCount(args: any, cb: Function) {
      RestApi.getDb("item")
        .where("code", "like", "%" + args.code + "%")
        .orderBy("count", "desc")
        .first()
        .then((result) => {
          cb(undefined, result);
        })
        .catch((err) => {
          cb(undefined, {
            error: {
              message: err.message || "Search Error."
            }
          });
        });
    }

    public getCategoryByDividePT(args: any, cb: Function) {
      const data: any = {};
      RestApi.getDb("purchase_pt_items")
        .leftJoin("category", "category_id", "category.id")
        .where("purchase_pt_items.id", args.item_id)
        .andWhere("current_qty", ">", 0)
        .select("purchase_pt_items.category_id", "purchase_pt_items.current_qty", "purchase_pt_items.category_id", "category.category_code", "category.category_name")
        .first()
        .then((result) => {
          cb(undefined, result);
        })
        .catch((err) => {
          cb(undefined, err);
        });
    }

    public getPurchasePtItems(args: any, cb: Function) {
      const data: any = [{
        "id": "",
        "code": "[Select One]"
      }];
      RestApi.getDb("purchase_pt_items")
        .leftJoin("purchase_pt", "purchase_pt_id", "purchase_pt.id")
        .where("current_qty", ">", 0)
        .andWhere("purchase_pt.isfinished", 1)
        .orWhere("purchase_pt_items.id", args.purchase_pt_items_id)
        .select("purchase_pt_items.id", "purchase_pt_items.code")
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
              message: err.message || "Get Purchase Pt Items Error."
            }
          });
        });
    }

    public getOutsideItem(args: any, cb: Function) {
      RestApi.getDb("give_outside_items")
        .leftJoin("give_outside", "give_outside_id", "give_outside.id")
        .where("give_outside_items.id", args.id)
        .select("give_outside_items.*", "give_outside.goldrate")
        .first()
        .then((result) => {
          cb(undefined, result);
        })
        .catch((err) => {
          cb(undefined, {
            error: {
              message: err.message || "Get Outside Items Error."
            }
          });
        });
    }

    public getPriceWithID(args: any, cb: Function) {
      RestApi.getDb("sale_diamond_items")
        .leftJoin("item", "item_id", "item.id")
        .leftJoin("category", "category_id", "category.id")
        .where("item_id", args.item_id)
        .select("sale_diamond_items.*", "item.category_id", "item.wgt_k", "item.wgt_p", "item.wgt_y", "item.diamond_qty", "category_name")
        .first()
        .then((result) => {
          cb(undefined, result);
        })
        .catch((err) => {
          cb(undefined, {
            error: {
              message: err.message || "Get Price Error."
            }
          });
        });
    }

    public getGoldPriceWithID(args: any, cb: Function) {
      let current_rate: any;
      let data: any = {};
      RestApi.getDb("sale_gold_items")
        .leftJoin("item", "item_id", "item.id")
        .where("item_id", args.item_id)
        .select("sale_gold_items.*", "item.category_id")
        .first()
        .then((result) => {
          data = result;
          return RestApi.getDb("goldrate_price").orderBy("createddate", "desc").select().first();
        })
        .then((result) => {
          if (data.goldrate == "a") {
            data.goldrate = "၁၆ ပဲရည်";
            current_rate = result.a;
          } else if (data.goldrate == "b") {
            data.goldrate = "၁၅ ပဲရည်";
            current_rate = result.b;
          } else if (data.goldrate == "c") {
            data.goldrate = "၁၄ ပဲရည်";
            current_rate = result.c;
          } else if (data.goldrate == "d") {
            data.goldrate = "၁၃ ပဲရည်";
            current_rate = result.d;
          }
          data.current_rate = Utils.addComma(current_rate);
          cb(undefined, data);
        })
        .catch((err) => {
          cb(undefined, {
            error: {
              message: err.message || "Get Price Error."
            }
          });
        });
    }

    public getCurrentRate(args: any, cb: Function) {
      RestApi.getDb("goldrate_price")
        .orderBy("createddate", "desc")
        .select()
        .first()
        .then((result) => {
          let current_rate = 0;
          if (args.goldrate == "a") {
            current_rate = result.a;
          } else if (args.goldrate == "b") {
            current_rate = result.b;
          } else if (args.goldrate == "c") {
            current_rate = result.c;
          } else {
            current_rate = result.d;
          }
          current_rate = Utils.addComma(current_rate);
          cb(undefined, current_rate);
        })
        .catch((err) => {
          cb(undefined, {
            error: {
              message: err.message || "Get Goldrate Price Error."
            }
          });
        });
    }

    public getReturnItem(args: any, cb: Function) {
      // RestApi.getDb("return_items")
      //   .whereNot("status", "boil")
      //   .orderBy("code")
      //   .select()
      RestApi.getKnex().raw(`SELECT * FROM return_items WHERE NOT status = 'boil' OR status IS NULL ORDER BY code`)
        .then((result) => {
          cb(undefined, {
            data: result[0]
          });
        })
        .catch((err) => {
          cb(undefined, {
            error: {
              message: err.message || "Get Return Item Error."
            }
          });
        });
    }

    public getReturnItemByDate(args: any, cb: Function) {
      const startDate = Utils.toSqlDate(args.start);
      const endDate = Utils.toSqlDate(args.end);
      RestApi.getKnex().raw(`SELECT * FROM return_items
          WHERE is_active = 1 AND is_production = 1 AND is_delete = 0 AND 
          date BETWEEN '` + startDate + `' AND '` + endDate + `'
          ORDER BY date`)
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

export default new ItemView();