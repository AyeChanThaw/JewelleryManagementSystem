/**
 * Sale Gold
 */
import * as express from "express";
import { ExpressRouter } from "../../lib/express-application";
import { Utils } from "../../lib/utils";
import config from "../../../data/config.json";
import * as RestApi from "../../lib/restapi";
import * as comfunc from "../../lib/comfunc";
import * as uuid from "uuid";
import moment from "moment";
import { Permission } from "../../lib/permission";

const jwtCredentialId = config.jwt.defCredentialId;

class SaleGoldRouter extends ExpressRouter {
  constructor() {
    super();

    this.route("/sale-gold").all(Permission.onLoad).get(this.getList);
    this.route("/sale-gold/entry").all(Permission.onLoad).get(this.getEntry).post(this.postEntry);
    this.route("/sale-gold/edit/:id").all(Permission.onLoad).get(this.getEdit).post(this.postEdit);
    this.route("/sale-gold/delete/:id").all(Permission.onLoad).post(this.postDelete);
    this.route("/sale-gold/preview/:id").all(Permission.onLoad).get(this.getPreview);
    this.route("/sale-gold-delete").all(Permission.onLoad).get(this.getDeleteList);
    this.route("/sale-gold/deliver/:id").all(Permission.onLoad).post(this.postDeliver);
  }

  public onLoad(req: express.Request, res: express.Response, next: express.NextFunction) {
    if (req.isAuthenticated()) {
      next();
    } else {
      res.redirect(`/login?url=${req.url}`);
    }
  }

  public getList(req: express.Request, res: express.Response, next: express.NextFunction) {
    let params: any = { title: config.appname, user: req.user.username };
    params = Permission.getMenuParams(params, req, res);
    if (typeof (<any>req).jwtToken == "function") {
      (<any>req).jwtToken(jwtCredentialId)
        .then((result: string) => {
          params.token = result;
          res.render("dashboard/sale-gold", params);
        })
        .catch((err: any) => {
          next(err);
        });

    } else {
      res.render("dashboard/sale-gold", params);
    }
  }

  public getEntry(req: express.Request, res: express.Response, next: express.NextFunction) {
    const id = req.params.id;
    let params: any = { title: config.appname, user: req.user.username, postUrl: "/sale-gold/entry", params: {}, listUrl: "/sale-gold" };
    params = Permission.getMenuParams(params, req, res);
    const prefix = "SG";
    let count = 0;
    const datecode = Utils.toGeneratecodeDate(new Date());
    RestApi.getDb("customer")
      .select()
      .then((result) => {
        const customers: any = [];
        result.forEach((cus) => {
          customers.push({label: cus.code, value: cus.id});
        });
        params.params.customers = customers;
        return RestApi.getDb("item").where("status", "gold").where("is_stock", 1).select();
      })
      .then((result) => {
        const items: any = [];
        if (result.length > 0) {
          result.forEach((item) => {
            items.push({label: item.code, value: item.id});
          });
        }
        params.params.items = items;
        return RestApi.getDb("goldrate_price").orderBy("createddate", "desc").select().first();
      })
      .then((result) => {
        params.params.current_rate = Utils.addComma(result.platinum);
        return RestApi.getDb("autogenerate").where("prefix", prefix).select();
      })
      .then((result) => {
        if (result[0].lastdate == datecode) {
          count = result[0].currentvalue + 1;
        } else {
          count++;
          result[0].lastdate = datecode;
        }
        const code = prefix + datecode + count;
        params.params.voc_no = code;

        if (typeof (<any>req).jwtToken == "function") {
          return (<any>req).jwtToken(jwtCredentialId);
        } else {
          return Promise.resolve("");
        }
      })
      .then((result) => {
        params.token = result;
        params.params.date = moment(new Date()).format("DD/MM/YYYY");
        params.payment_array = [];
        params.item_array = [];
        params.order_array = [];
        res.render("dashboard/sale-gold-entry", params);
      })
      .catch((err: any) => {
        next(err);
      });
  }

  public postEntry(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = comfunc.fillDefaultFields(req.body);
    data.date = Utils.toSqlDate(data.date);
    data.id = uuid.v4();
    data.is_order = data.is_order == "on" ? 1 : 0;
    data.is_debt = data.is_debt == "on" ? 1 : 0;
    data.total_amount = Utils.removeComma(data.total_amount);
    data.subtotal = Utils.removeComma(data.subtotal);
    data.cash_amount = 0;
    data.bank_amount = 0;
    if (data.order_total_amount == "" || data.order_total_amount == undefined || data.order_total_amount == null)
      data.order_total_amount = 0;
    if (data.debt_amount == "" || data.debt_amount == undefined || data.debt_amount == null)
      data.debt_amount = 0;
    else
      data.debt_amount = Utils.removeComma(data.debt_amount);
    data.pay_amount = Number(data.total_amount) - (Number(data.discount_amount ) + Number(data.debt_amount));
    const payment_array = JSON.parse(data.payment_array);
    const payment_arr: any = [];
    const item_array = JSON.parse(data.item_array);
    const item_arr: any = [];
    const order_array = JSON.parse(data.order_array);
    const order_arr: any = [];
    const query: any = [];
    const customer_name = data.customer_name;
    const phone = data.phone;
    const date = Utils.toSqlDate(new Date());
    console.log("item arr ", item_arr);
    payment_array.forEach((payment: any) => {
      payment.id = uuid.v4();
      payment.sale_gold_id = data.id;
      delete payment.account;
      if (payment.payment_type == "bank") {
        data.bank_amount += Number(payment.amount);
      } else {
        data.cash_amount += Number(payment.amount);
      }
      payment = comfunc.fillDefaultFields(payment);
      payment_arr.push(payment);

      let cash_payment: any = {
        id: uuid.v4(),
        cash_id: data.id,
        bank_id: payment.bank_id,
        amount: payment.amount,
        payment_type: payment.payment_type,
        type: "cash_in_showroom"
      }
      cash_payment = comfunc.fillDefaultFields(cash_payment);
      query.push(RestApi.getDb("daily_cash_payment").insert(cash_payment, "id"));
    });
    item_array.forEach((item: any) => {
      item.id = uuid.v4();
      item.sale_gold_id = data.id;
      if (item.goldrate == "၁၆ပဲရည်")
        item.goldrate = "a";
      else if (item.goldrate == "၁၅ပဲရည်")
        item.goldrate = "b";
      else if (item.goldrate == "၁၄ပဲရည်")
        item.goldrate = "c";
      else if (item.goldrate == "၁၃ပဲရည်")
        item.goldrate = "d";
      item = comfunc.fillDefaultFields(item);
      item_arr.push(item);
      query.push(RestApi.getDb("item").where("id", item.item_id).update({"is_stock": 0, "is_sale": 1, "sale_date": date, "updateddate": Utils.toSqlDate(new Date())}));
    });
    order_array.forEach((order: any) => {
      let ord: any = {
        id: uuid.v4(),
        sale_id: data.id,
        order_id: order.order_gold_id,
        type: "gold"
      }
      ord = comfunc.fillDefaultFields(ord);
      order_arr.push(ord);
      query.push(RestApi.getDb("order_gold").where("id", order.order_gold_id).update({"is_active": 0, "updateddate": Utils.toSqlDate(new Date())}));
    });
    delete (data.payment_array);
    delete (data.item_array);
    delete (data.order_array);
    delete (data.customers);
    delete (data.items);
    delete (data.customer_code);
    delete (data.customer_name);
    delete (data.phone);
    delete (data.order_voc_no);
    if (data.is_order == 1) {
      query.push(RestApi.getKnex().batchInsert("sale_order", order_arr));
    }
    RestApi.getDb("autogenerate").select("*").where("prefix", "SG")
      .then((result) => {
        const datecode = Utils.toGeneratecodeDate(new Date());
        let count = 0;
        let autogenresult: any = [];
        if (result[0].lastdate == datecode) {
          count = result[0].currentvalue + 1;
        } else {
          count++;
          result[0].lastdate = datecode;
        }
        result[0].currentvalue = count;
        result[0].lastdate = Utils.toGeneratecodeDate(new Date());
        result[0].updateddate = Utils.toSqlDate(new Date());
        autogenresult = result[0];
        delete (result[0].id);

        if (result[0].lastdate == datecode) {
          return RestApi.getDb("autogenerate").where("prefix", "SG").update({ "currentvalue": count, "lastdate": datecode, "updateddate": date }, "id") as PromiseLike<any>;
        }
      })
      .then((result) => {
        return RestApi.getKnex().batchInsert("sale_gold_payment", payment_arr);
      })
      .then((result) => {
        if (data.is_debt == 1) {
          let customer_debt: any = {
            id: uuid.v4(),
            date: Utils.toSqlDate(new Date()),
            customer_id: data.customer_id,
            sale_gold_id: data.id,
            sale_diamond_id: null,
            amount: data.debt_amount,
            balance: data.debt_amount
          };
          customer_debt = comfunc.fillDefaultFields(customer_debt);
          query.push(RestApi.getDb("customer_debt").insert(customer_debt, "id"));
        } else {
          data.debt_amount = 0;
        }

        // Daily Cash For Showroom
        const cash_amount = Number(data.subtotal) - Number(data.debt_amount);
        if (cash_amount != 0) {
          let daily_cash: any = {
            id: uuid.v4(),
            date: Utils.toSqlDate(new Date()),
            type_id: data.id,
            cash_in: 0,
            status: "sale",
            type: "sale_gold",
            user_id: req.user.id,
            sale_person_id: data.sale_person_id
          };
          if (Number(data.subtotal) < 0) {
            daily_cash.cash_in = 0;
            daily_cash.cash_out = Math.abs(data.subtotal);
            let cash_in: any = {
              id: uuid.v4(),
              date: date,
              daily_cash_in_type_id: "c30c63d1-a426-49e6-857c-10ca4968d468",
              title: "Gold Sale",
              total_amount: cash_amount,
              bank_amount: data.bank_amount,
              cash_amount: data.cash_amount,
              type_id: data.id,
              status: "sale_gold"
            }
            cash_in = comfunc.fillDefaultFields(cash_in);
            query.push(RestApi.getDb("daily_usage_showroom").insert(cash_in, "id"));
          } else {
            daily_cash.cash_in = cash_amount;
            let cash_in: any = {
              id: uuid.v4(),
              date: date,
              daily_cash_in_type_id: "c30c63d1-a426-49e6-857c-10ca4968d468",
              title: "Gold Sale",
              total_amount: cash_amount,
              bank_amount: data.bank_amount,
              cash_amount: data.cash_amount,
              type_id: data.id,
              status: "sale_gold"
            }
            cash_in = comfunc.fillDefaultFields(cash_in);
            query.push(RestApi.getDb("daily_cash_in_showroom").insert(cash_in, "id"));
          }
          daily_cash = comfunc.fillDefaultFields(daily_cash);
          query.push(RestApi.getDb("daily_cash_showroom").insert(daily_cash, "id"));
        }
        if (query.length > 0) {
          return Promise.all(query);
        } else {
          return undefined;
        }
      })
      .then((result) => {
        return RestApi.getDb("sale_gold").insert(data, "id");
      })
      .then((result) => {
        return RestApi.getKnex().batchInsert("sale_gold_items", item_arr);
      })
      .then((result) => {
        res.json({ "success": result });
      })
      .catch((err) => {
        console.log(`${err}`);
        res.json({ "error": err });
      });
  }

  public getEdit(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = { id: req.params.id };
    if (Utils.isEmpty(data.id)) {
      return comfunc.sendForbidden(next);
    }
    const postUrl = `/sale-gold/edit/${data.id}`;
    let params: any = { title: config.appname, user: req.user.username, postUrl: postUrl, listUrl: "/sale-gold" };
    params = Permission.getMenuParams(params, req, res);

    RestApi.getDb("sale_gold")
      .leftJoin("customer", "customer_id", "customer.id")
      .leftJoin("order_gold", "order_gold_id", "order_gold.id")
      .where({ "sale_gold.id": data.id })
      .select("sale_gold.*", "customer.code as customer_code", "customer.customer_name", "customer.phone", "order_gold.voc_no as order_voc_no")
      .then((result) => {
        result[0].date = Utils.toDisplayDate(result[0].date);
        params.params = Utils.mixin(data, result[0]);
        return RestApi.getDb("sale_gold_payment").leftJoin("bank", "bank_id", "bank.id").where("sale_gold_id", data.id).select("sale_gold_payment.*", "bank.bank_name", "bank.account");
      })
      .then((result) => {
        params.payment_array = result;
        return RestApi.getDb("sale_gold_items").leftJoin("item", "item_id", "item.id").where("sale_gold_id", data.id).select("sale_gold_items.*", "item.code", "item.item_name");
      })
      .then((result) => {
        if (result.length > 0) {
          result.forEach((item) => {
            if (item.goldrate == "a")
              item.goldrate = "၁၆ပဲရည်";
            else if (item.goldrate == "b")
              item.goldrate = "၁၅ပဲရည်";
            else if (item.goldrate == "c")
              item.goldrate = "၁၄ပဲရည်";
            else if (item.goldrate == "d")
              item.goldrate = "၁၃ပဲရည်";
          });
        }
        params.item_array = result;
        return RestApi.getDb("customer").select();
      })
      .then((result) => {
        const customers: any = [];
        let name = "";
        result.forEach((cus) => {
          name = cus.customer_name + " (" + cus.phone + ")";
          customers.push({label: name, value: cus.id});
        });
        params.params.customers = customers;
        return RestApi.getDb("item").where("status", "gold").where("is_stock", 1).select();
      })
      .then((result) => {
        const items: any = [];
        if (result.length > 0) {
          result.forEach((item) => {
            items.push({label: item.code, value: item.id});
          });
        }
        params.params.items = items;
        if (typeof (<any>req).jwtToken == "function") {
          return (<any>req).jwtToken(jwtCredentialId);
        } else {
          return Promise.resolve("");
        }
      })
      .then((result) => {
        params.token = result;
        res.render("dashboard/sale-gold-entry", params);
      })
      .catch((err) => {
        console.log(`${err}`);
        next({ "error": err });
      });
  }

  public postEdit(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = comfunc.fillDefaultFields(req.body);
    data.date = Utils.toSqlDate(data.date);
    if (data.is_order == "on" || data.is_order == "1") {
      data.is_order = 1;
    }
    else {
      data.is_order = 0;
    }
    if (data.is_debt == "on" || data.is_debt == "1") {
      data.is_debt = 1;
    }
    else {
      data.is_debt = 0;
    }
    data.pay_amount = Number(data.total_amount) - (Number(data.discount_amount ) + Number(data.debt_amount));
    const payment_array = JSON.parse(data.payment_array);
    const payment_arr: any = [];
    const item_array = JSON.parse(data.item_array);
    const item_arr: any = [];
    const daily_cash: any = {};
    const query: any = [];
    const date = Utils.toSqlDate(new Date);
    query.push(RestApi.getDb("daily_cash_payment").where({"cash_id": data.id, "type": "cash_in_showroom"}).delete());
    query.push(RestApi.getDb("daily_cash_in_showroom").where({"type_id": data.id, "status": "sale_gold"}).delete());
    query.push(RestApi.getDb("daily_usage_showroom").where({"type_id": data.id, "status": "sale_gold"}).delete());
    payment_array.forEach((payment: any) => {
      if (payment.id && payment.id != "") {
        payment.createddate = date;
        payment.updateddate = date;
        delete payment.account;
        delete payment.bank_name;
      } else {
        payment.id = uuid.v4();
        delete payment.account;
        payment = comfunc.fillDefaultFields(payment);
        payment.sale_gold_id = data.id;
      }
      if (payment.payment_type == "bank") {
        data.bank_amount += Number(payment.amount);
      } else {
        data.cash_amount += Number(payment.amount);
      }
      payment_arr.push(payment);
      let cash_payment: any = {
        id: uuid.v4(),
        cash_id: data.id,
        bank_id: payment.bank_id,
        amount: payment.amount,
        payment_type: payment.payment_type,
        type: "cash_in_showroom"
      }
      cash_payment = comfunc.fillDefaultFields(cash_payment);
      query.push(RestApi.getDb("daily_cash_payment").insert(cash_payment, "id"));
    });
    item_array.forEach((item: any) => {
      if (item.id && item.id != "") {
        item.createddate = date;
        item.updateddate = date;
        delete item.item_name;
        delete item.code;
      } else {
        item.id = uuid.v4();
        item = comfunc.fillDefaultFields(item);
        item.sale_gold_id = data.id;
      }
      if (item.goldrate == "၁၆ပဲရည်")
        item.goldrate = "a";
      else if (item.goldrate == "၁၅ပဲရည်")
        item.goldrate = "b";
      else if (item.goldrate == "၁၄ပဲရည်")
        item.goldrate = "c";
      else if (item.goldrate == "၁၃ပဲရည်")
        item.goldrate = "d";
      item = comfunc.fillDefaultFields(item);
      item_arr.push(item);
    });
    delete (data.payment_array);
    delete (data.item_array);
    delete (data.customers);
    delete (data.items);
    delete (data.customer_code);
    delete (data.customer_name);
    delete (data.phone);
    delete (data.order_voc_no);
    let db = RestApi.getDb("sale_gold");
    if (Utils.isEmpty(data.id)) {
      return comfunc.sendForbidden(res);
    }

    db = db.where({ id: data.id });
    RestApi.getDb("sale_gold")
      .where("id", data.id)
      .select()
      .first()
      .then((result) => {
        if (result) {
          if (result.is_order == 1) { // have old order record
            if (data.is_order == 1) {
              if (data.order_gold_id != result.order_gold_id) {
                query.push(RestApi.getDb("order_gold").where("id", result.order_gold_id).update({"is_active": 1, "updateddate": date}));
                query.push(RestApi.getDb("order_gold").where("id", data.order_gold_id).update({"is_active": 0, updateddate: date}));
              }
            } else {
              query.push(RestApi.getDb("order_gold").where("id", result.order_gold_id).update({"is_active": 1, "updateddate": date}));
            }
          } else { // no old order record
            if (data.is_order == 1) {
              query.push(RestApi.getDb("order_gold").where("id", data.order_gold_id).update({"is_active": 0, updateddate: date}));
            }
          }
          const cash_amount = Number(data.subtotal) - Number(data.debt_amount);
          if (result.subtotal == result.debt_amount) {  // no daily_cash_showroom old record
            if (cash_amount > 0) {
              let daily_cash: any = {
                id: uuid.v4(),
                date: Utils.toSqlDate(new Date()),
                type_id: data.id,
                cash_in: cash_amount,
                status: "sale",
                type: "sale_gold",
                user_id: req.user.id
              };
              daily_cash = comfunc.fillDefaultFields(daily_cash);
              query.push(RestApi.getDb("daily_cash_showroom").insert(daily_cash, "id"));
              let cash_in: any = {
                id: uuid.v4(),
                date: date,
                daily_cash_in_type_id: "c30c63d1-a426-49e6-857c-10ca4968d468",
                title: "Gold Sale",
                total_amount: cash_amount,
                bank_amount: data.bank_amount,
                cash_amount: data.cash_amount,
                type_id: data.id,
                status: "sale_gold"
              }
              cash_in = comfunc.fillDefaultFields(cash_in);
              query.push(RestApi.getDb("daily_cash_in_showroom").insert(cash_in, "id"));
            }
          } else { // has daily_cash_showroom old record
            if (cash_amount > 0) {
              query.push(RestApi.getDb("daily_cash_showroom").where({"type_id": data.id, "type": "sale_gold"}).update({"cash_in": cash_amount, "updateddate": date}));
              let cash_in: any = {
                id: uuid.v4(),
                date: date,
                daily_cash_in_type_id: "c30c63d1-a426-49e6-857c-10ca4968d468",
                title: "Gold Sale",
                total_amount: cash_amount,
                bank_amount: data.bank_amount,
                cash_amount: data.cash_amount,
                type_id: data.id,
                status: "sale_gold"
              }
              cash_in = comfunc.fillDefaultFields(cash_in);
              query.push(RestApi.getDb("daily_cash_in_showroom").insert(cash_in, "id"));
            } else {
              query.push(RestApi.getDb("daily_cash_showroom").where({"type_id": data.id, "type": "sale_gold"}).delete());
            }
          }
          if (result.debt_amount > 0) { // has customer_debt old record
            if (data.debt_amount > 0) {
              if (result.debt_amount != data.debt_amount) {
                query.push(RestApi.getDb("customer_debt").where("sale_gold_id", data.id).update({amount: data.debt_amount, balance: data.debt_amount, updateddate: date}));
              }
            } else {
              query.push(RestApi.getDb("customer_debt").where("sale_gold_id", data.id).delete());
            }
          } else { // no customer_debt old record
            let customer_debt: any = {
              id: uuid.v4(),
              date: Utils.toSqlDate(new Date()),
              customer_id: data.customer_id,
              sale_gold_id: data.id,
              sale_diamond_id: null,
              amount: data.debt_amount,
              balance: data.debt_amount
            };
            customer_debt = comfunc.fillDefaultFields(customer_debt);
            query.push(RestApi.getDb("customer_debt").insert(customer_debt, "id"));
          }
        }
        return RestApi.getDb("sale_gold_items").where("sale_gold_id", data.id).select();
      })
      .then((result) => {
        if (result.length > 0) {
          result.forEach((item) => {
            query.push(RestApi.getDb("item").where("id", item.item_id).update({"is_stock": 1, "is_sale": 0, updateddate: date}));
          });
        }
        item_arr.forEach((item: any) => {
          query.push(RestApi.getDb("item").where("id", item.item_id).update({"is_stock": 0, "is_sale": 1, "sale_date": date, "updateddate": date}));
        });
        if (query.length > 0) {
          return Promise.all(query);
        } else {
          return undefined;
        }
      })
      .then((result) => {
        return db.update(data, "id");
      })
      .then((result) => {
        return RestApi.getDb("sale_gold_payment").where("sale_gold_id", data.id).delete();
      })
      .then((result) => {
        return RestApi.getKnex().batchInsert("sale_gold_payment", payment_arr);
      })
      .then((result) => {
        return RestApi.getDb("sale_gold_items").where("sale_gold_id", data.id).delete();
      })
      .then((result) => {
        return RestApi.getKnex().batchInsert("sale_gold_items", item_arr);
      })
      .then((result) => {
        res.json({ "success": result });
      })
      .catch((err) => {
        console.log(`${err}`);
        res.json({ "error": err });
      });
  }

  public postDelete(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = { id: req.params.id };
    let return_gold: any = [];
    const query: any = [];
    const date = Utils.toSqlDate(new Date());
    const user_id: any = req.user.id;
    if (Utils.isEmpty(data.id)) {
      return comfunc.sendForbidden(res);
    }
    RestApi.getDb("return_gold_items")
      .where("sale_gold_id", data.id)
      .select()
      .then((result) => {
        return_gold = result;
        if (return_gold > 0) {
          throw new Error("Can not Delete. Already Used!");
        } else {
          return RestApi.getDb("sale_gold").where("id", data.id).select();
        }
      })
      .then((result) => {
        if (result.length > 0) {
          // if (result[0].is_order == 1) {
          //   query.push(RestApi.getDb("order_gold").where("id", result[0].order_gold_id).update({"is_active": 1, "updateddate": date}));
          // }
          if (result[0].is_debt == 1) {
            query.push(RestApi.getDb("customer_debt").where("sale_gold_id", data.id).delete());
          }
        }
        return RestApi.getDb("sale_order").where({"sale_id": data.id, "type": "gold"}).select();
      })
      .then((result) => {
        if (result && result.length > 0) {
          result.forEach((order) => {
            query.push(RestApi.getDb("order_gold").where("id", order.order_id).update({"is_active": 1, "updateddate": date}));
          });
          query.push(RestApi.getDb("sale_order").where({"sale_id": data.id, "type": "gold"}).delete());
        }
        if (query.length > 0) {
          return Promise.all(query);
        } else {
           return undefined;
        }
      })
      .then((result) => {
        return RestApi.getKnex().raw(`UPDATE item SET item.is_stock = 1, item.is_sale = 0, sale_date = NULL
                                      WHERE item.id IN (SELECT item_id 
                                                FROM sale_gold_items 
                                                WHERE sale_gold_id = '` + data.id + `')`);
      })
      .then((result) => {
        return RestApi.getDb("sale_gold_payment").where("sale_gold_id", data.id).update({ "is_delete": 1 });
      })
      .then((result) => {
        return RestApi.getDb("sale_gold_items").where("sale_gold_id", data.id).update({ "is_delete": 1 });
      })
      .then((result) => {
        return RestApi.getDb("daily_cash_showroom").where({"type_id": data.id, "status": "sale"}).delete();
      })
      .then((result) => {
        return RestApi.getDb("sale_gold").where({ id: data.id }).update({ "is_active": 0, "is_delete": 1, "deleted_user_id": user_id, "deleted_date": Utils.toSqlDate(new Date()) });
      })
      .then((result) => {
        res.json({ "success": result });
      })
      .catch((err) => {
        console.log(`${err}`);
        res.json({ "error": err });
      });
  }

  public postDeliver(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = comfunc.fillDefaultFields(req.body);
    data.id = req.params.id;
    console.log("data ", data);
    const date = Utils.toSqlDate(new Date());
    if (Utils.isEmpty(data.id)) {
      return comfunc.sendForbidden(res);
    }
    RestApi.getDb("sale_gold")
      .where("id", data.id)
      .update({ "deliver_date": date, "description": data.description }, "id")
      .then((result) => {
        res.json({ "success": result });
      })
      .catch((err) => {
        console.log(`${err}`);
        res.json({ "error": err });
      });
  }

  public getDeleteList(req: express.Request, res: express.Response, next: express.NextFunction) {
    let params: any = { title: config.appname, user: req.user.username };
    params = Permission.getMenuParams(params, req, res);
    if (typeof (<any>req).jwtToken == "function") {
      (<any>req).jwtToken(jwtCredentialId)
        .then((result: string) => {
          params.token = result;
          res.render("dashboard/sale-gold-delete", params);
        })
        .catch((err: any) => {
          next(err);
        });

    } else {
      res.render("dashboard/sale-gold-delete", params);
    }
  }

  public getPreview(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = { id: req.params.id };
    const id = data.id;

    if (Utils.isEmpty(id)) {
      return comfunc.sendForbidden(next);
    }
    const postUrl = `/sale-gold/customer-preview/${data.id}`;
    let params: any = { title: config.appname, user: req.user.username, postUrl: postUrl, params: data };
    // let params: any = { title: config.appname, user: req.user.username, params: data };
    params = Permission.getMenuParams(params, req, res);

    RestApi.getDb("sale_gold")
      .leftJoin("customer", "sale_gold.customer_id", "customer.id")
      .leftJoin("sale_person", "sale_gold.sale_person_id", "sale_person.id")
      .where({ "sale_gold.id": data.id })
      .select("sale_gold.*", "customer.code as customer_code", "customer.customer_name", "customer.phone", "sale_person.sale_person_name")
      .then((result) => {
        result[0].date = Utils.toDisplayDate(result[0].date);
        result[0].print_date = Utils.toDisplayDate(new Date());
        params.params = Utils.mixin(data, result[0]);
        const payment_amount = Number(params.params.subtotal) - Number(params.params.debt_amount);
        // Thousand Separator
        params.params.total_amount = Utils.numberWithCommas(params.params.total_amount);
        params.params.order_total_amount = Utils.numberWithCommas(params.params.order_total_amount);
        params.params.discount_amount = Utils.numberWithCommas(params.params.discount_amount);
        params.params.subtotal = Utils.numberWithCommas(params.params.subtotal);
        params.params.debt_amount = Utils.numberWithCommas(params.params.debt_amount);
        params.params.payment_amount = Utils.numberWithCommas(payment_amount);
        return RestApi.getDb("sale_gold_items")
          .leftJoin("sale_gold", "sale_gold_items.sale_gold_id", "sale_gold.id")
          .leftJoin("item", "sale_gold_items.item_id", "item.id")
          .where({ "sale_gold_items.sale_gold_id": data.id })
          .select("sale_gold_items.*", "sale_gold.voc_no", "item.item_name");
      })
      .then((result) => {
        if (result.length > 0) {
          // Thousand Separator
          result.forEach((item) => {
            item.price = Utils.numberWithCommas(item.price);
          });
        }
        params.item_array = result;

        if (typeof (<any>req).jwtToken == "function") {
          return (<any>req).jwtToken(jwtCredentialId);
        } else {
          return Promise.resolve("");
        }
      })
      .then((result) => {
        params.token = result;
        res.render("dashboard/sale-gold-preview", params);
      })
      .catch((err) => {
        console.log(`${err}`);
        next({ "error": err });
      });
  }
}

export default new SaleGoldRouter();