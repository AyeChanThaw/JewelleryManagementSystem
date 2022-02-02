/**
 * Customer View Model
 */
import * as RestApi from "../lib/restapi";
import * as knex from "knex";
import { Utils } from "../lib/utils";
import * as comfunc from "../lib/comfunc";
import * as uuid from "uuid";

export class CustomerView {
    constructor() { }

    public index(args: any, cb: Function) {
        RestApi.getDb("category")
            .select("category.*", "item.item_name")
            .leftJoin("item", "category.item_id", "item.id")
            .then((result) => {
                cb(undefined, {
                    category: result
                });
            })
            .catch((err) => {
                cb(undefined, err);
            });

    }

    public searchCustomer(args: any, cb: Function) {
      const data: any = {
        success: true,
        data: []
      };
      const search = args.search;
      let dbQuery = RestApi.getDb("customer");
      if (search && search != "") {
        dbQuery = dbQuery.where("code", "like", "%" + search + "%")
                        .orWhere("customer_name", "like", "%" + search + "%");
      }
      dbQuery.select()
        .then((result) => {
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

    public insertCustomer(args: any, cb: Function) {
      let data = args.data;
      const currentDate = Utils.toSqlDate(new Date());
      data.id = uuid.v4();
      data = comfunc.fillDefaultFields(data);
      const prefix = "CUS";
      let count = 0;
      const datecode = Utils.toGeneratecodeDate(new Date());
      const query: any = [];

      RestApi.getDb("autogenerate")
        .select()
        .where("prefix", prefix)
        .then((result) => {
          if (result[0].lastdate == datecode) {
            count = result[0].currentvalue + 1;
          } else {
            count++;
            result[0].lastdate = datecode;
          }
          data.code = prefix + datecode + count;
          query.push(RestApi.getDb("autogenerate").where("prefix", prefix).update({ currentvalue: count, lastdate: datecode, updateddate: currentDate }, "id"));
          query.push(RestApi.getDb("customer").insert(data, "id"));
          return RestApi.getKnex().transaction(function (trx) {
                    Promise.all(query)
                      .then(trx.commit)
                      .catch(trx.rollback);
                  }) as PromiseLike<any>;
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
              message: err.message || "Adding Customer Error"
            }
          });
        });
    }

    public getCustomer(args: any, cb: Function) {
      const data: any = {
          data: []
      };
      RestApi.getDb("customer")
          .select("id", "code", "customer_name")
          .then((result) => {
              data.data = result;
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

    public getCustomerById(args: any, cb: Function) {
      const data: any = {};
      RestApi.getDb("customer")
        .where("id", args.id)
        .select()
        .then((result) => {
          data.customer = result;
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

    public checkDate(args: any, cb: Function) {
        const date = Utils.toSqlDate(args.date);
        RestApi.getDb("openamount")
          .where("date", date)
          .andWhere("id", "!=", args.recordid)
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

    public getCategory(args: any, cb: Function) {
      const data: any = [{
        "id": "",
        "category_name": "[Select One]"
      }];
      RestApi.getDb("category")
        .select()
        .then((result) => {
          if (result.length > 0) {
            result.forEach((item) => {
              data.push(item);
            });
          }
          // data = result;
          cb(undefined, data);
        })
        .catch((err) => {
          cb(undefined, {
            error: {
              message: err.message || "Get Category Error."
            }
          });
        });
    }

    public getBank(args: any, cb: Function) {
      const data: any = [{
        "id": "",
        "bank_name": "[Select One]"
      }];
      RestApi.getDb("bank")
        .select()
        .then((result) => {
          if (result.length > 0) {
            result.forEach((item) => {
              data.push(item);
            });
          }
          // data = result;
          cb(undefined, data);
        })
        .catch((err) => {
          cb(undefined, {
            error: {
              message: err.message || "Get Bank Error."
            }
          });
        });
    }

    public getWax(args: any, cb: Function) {
      const data: any = [{
        "id": "",
        "name": "[Select One]"
      }];
      RestApi.getDb("waxing")
        .select()
        .then((result) => {
          if (result.length > 0) {
            result.forEach((item) => {
              data.push(item);
            });
          }
          // data = result;
          cb(undefined, data);
        })
        .catch((err) => {
          cb(undefined, {
            error: {
              message: err.message || "Get Wax Error."
            }
          });
        });
    }

    public getstockByGoldrate(args: any, cb: Function) {
      RestApi.getDb("stock")
        .select()
        .first()
        .then((result) => {
          const column = args.goldrate;
          let stock = 0;
          if (column == "py_13")
            stock = result.py_13;
          else if (column == "py_14")
            stock = result.py_14;
          else if (column == "py_15")
            stock = result.py_15;
          else if (column == "py_16")
            stock = result.py_16;
          cb(undefined, stock);
        })
        .catch((err) => {
          cb(undefined, {
            error: {
              message: err.message || "Get Goldrate Error."
            }
          });
        });
    }

    public getSupplier(args: any, cb: Function) {
      const data: any = [];
      RestApi.getDb("supplier")
        .select()
        .then((result) => {
          if (result.length > 0) {
            result.forEach((supplier) => {
              const item: any = {
                id: supplier.id,
                name: supplier.sale_person + " (" + supplier.supplier_name + ")"
              };
              data.push(item);
            });
          }
          cb(undefined, data);
        })
        .catch((err) => {
          cb(undefined, {
            error: {
              message: err.message || "Get Supplier Error."
            }
          });
        });
    }
}

export default new CustomerView();