/**
 * Cart View Model
 */
import * as RestApi from "../lib/restapi";
import * as knex from "knex";
import * as uuid from "uuid";
import { Utils } from "../lib/utils";

export class CartView {
    constructor() { }

    public index(args: any, cb: Function) {
        const data: any = {
            success: true,
            data: [],
            message: ""
        };
        RestApi.getDb("cart")
            .select("cart.*", "item.item_name")
            .leftJoin("item", "item_id", "item.id")
            .where("cart.sale_person_id", args.sale_person_id)
            // .where("cart.customer_id", args.customer_id)
            .then((result) => {
              if (result.length > 0) {
                data.data = result;
                const type = result[0].type;
                if (type == "pt")
                  data.message = "diamond";
                else
                  data.message = type;
              }
              cb(undefined, data);
            })
            .catch((err) => {
              cb(undefined, {
                success: false,
                errors: {
                  message: err.message || "Cart List Error."
                }
              });
            });

    }

    public addToCart(args: any, cb: Function) {
      const cartData: any = [];
      const query: any = [];
      const currentDate = Utils.toSqlDate(new Date());
      const data = args.data;
      data.id = uuid.v4();
      data.date = currentDate;
      data.createddate = currentDate;
      data.updateddate = currentDate;
      query.push(RestApi.getDb("item").where("id", data.item_id).update({"is_stock": 0, "is_cart": 1, "updateddate": currentDate}));
      query.push(RestApi.getDb("cart").insert(data, "id"));

      RestApi.getKnex().transaction(function (trx) {
          Promise.all(query)
            .then(trx.commit)
            .catch(trx.rollback);
        })
        .then((result) => {
          cb(undefined, {
            success: true
          });
        })
        .catch((err) => {
          cb(undefined, {
            success: false,
            errors: {
              message: err.message || "Adding cart error"
            }
          });
        });
    }

    public deleteCart(args: any, cb: Function) {
      let category_id: any = "";
      let category_name: any = "";
      const query: any = [];
      RestApi.getDb("cart")
        .leftJoin("item", "cart.item_id", "item.id")
        .leftJoin("category", "category_id", "category.id")
        .where("cart.id", args.id)
        .select("cart.*", "item.category_id", "category_name")
        .then((result) => {
          category_id = result[0].category_id;
          category_name = result[0].category_name;
          if (result && result.length > 0) {
            query.push(RestApi.getDb("item").where("id", result[0].item_id).update({"is_stock": 1, "is_cart": 0, "updateddate": Utils.toSqlDate(new Date())}));
            query.push(RestApi.getDb("cart").where("id", args.id).delete());
            return RestApi.getKnex().transaction(function (trx) {
              Promise.all(query)
                .then(trx.commit)
                .catch(trx.rollback);
            }) as PromiseLike<any>;
          } else {
            throw new Error("No cart with this ID.");
          }
        })
        .then((result) => {
            cb(undefined, {
                category_id: category_id,
                category_name: category_name,
                success: true
            });
        })
        .catch((err) => {
            cb(undefined, {
                success: false,
                errors: {
                  message: err.message || "Delete cart error"
                }
            });
        });
    }

    public deleteAll(args: any, cb: Function) {
      const query: any = [];
      RestApi.getDb("cart").where("sale_person_id", args.sale_person_id)
        .select()
        .then((result) => {
          if (result.length > 0) {
            result.forEach((cart) => {
              query.push(RestApi.getDb("item").where("id", cart.item_id).update({"is_stock": 1, "updateddate": Utils.toSqlDate(new Date())}));
            });
            query.push(RestApi.getDb("cart").where("sale_person_id", args.sale_person_id).delete());
            return RestApi.getKnex().transaction(function (trx) {
                      Promise.all(query)
                        .then(trx.commit)
                        .catch(trx.rollback);
                    }) as PromiseLike<any>;
          } else {
            throw new Error("No cart with this sale person.");
          }
        })
        .then((result) => {
            cb(undefined, {
                success: true
            });
        })
        .catch((err) => {
            cb(undefined, {
                success: false,
                errors: {
                  message: err.message || "Delete cart error"
                }
            });
        });
    }
}

export default new CartView();