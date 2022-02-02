/**
 * Sale Diamond
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

class SaleDiamondRouter extends ExpressRouter {
  constructor() {
    super();

    this.route("/sale-diamond").all(Permission.onLoad).get(this.getList);
    this.route("/sale-diamond/entry").all(Permission.onLoad).get(this.getEntry).post(this.postEntry);
    this.route("/sale-diamond/edit/:id").all(Permission.onLoad).get(this.getEdit).post(this.postEdit);
    this.route("/sale-diamond/delete/:id").all(Permission.onLoad).post(this.postDelete);
    this.route("/sale-diamond/customer-preview/:id").all(Permission.onLoad).get(this.getCustomer);
    this.route("/sale-diamond/shop-preview/:id").all(Permission.onLoad).get(this.getShop);
    this.route("/sale-diamond-delete").all(Permission.onLoad).get(this.getDeleteList);
    this.route("/sale-diamond/deliver/:id").all(Permission.onLoad).post(this.postDeliver);
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
          res.render("dashboard/sale-diamond", params);
        })
        .catch((err: any) => {
          next(err);
        });

    } else {
      res.render("dashboard/sale-diamond", params);
    }
  }

  public getEntry(req: express.Request, res: express.Response, next: express.NextFunction) {
    const id = req.params.id;
    let params: any = { title: config.appname, user: req.user.username, postUrl: "/sale-diamond/entry", params: {}, listUrl: "/sale-diamond" };
    params = Permission.getMenuParams(params, req, res);
    const prefix = "SD";
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
        return RestApi.getDb("item").whereIn("status", ["diamond", "pt"]).where("is_stock", 1).select();
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
        params.params.current_rate = result.platinum;
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
        // params.params.is_pickup = 1;
        params.payment_array = [];
        params.item_array = [];
        params.order_array = [];
        params.change_array = [];
        res.render("dashboard/sale-diamond-entry", params);
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
    data.is_change = data.is_change == "on" ? 1 : 0;
    data.is_debt = data.is_debt == "on" ? 1 : 0;
    data.total_amount = Utils.removeComma(data.total_amount);
    data.subtotal = Utils.removeComma(data.subtotal);
    data.cash_amount = 0;
    data.bank_amount = 0;
    data.pay_amount = Number(data.total_amount) - (Number(data.discount_amount ) + Number(data.debt_amount));
    if (data.order_total_amount == "" || data.order_total_amount == undefined || data.order_total_amount == null)
      data.order_total_amount = 0;
    if (data.change_total_amount == "" || data.change_total_amount == undefined || data.change_total_amount == null)
      data.change_total_amount = 0;
    if (data.debt_amount == "" || data.debt_amount == undefined || data.debt_amount == null)
      data.debt_amount = 0;
    else
      data.debt_amount = Utils.removeComma(data.debt_amount);
    // if (data.change_percentage == "" || data.change_percentage == undefined || data.change_percentage == null)
    //   data.change_percentage = 0;
    if (data.profit_amount == "" || data.profit_amount == undefined || data.profit_amount == null)
      data.profit_amount = 0;
    else
      data.profit_amount = Utils.removeComma(data.profit_amount);
    const payment_array = JSON.parse(data.payment_array);
    const payment_arr: any = [];
    const item_array = JSON.parse(data.item_array);
    const item_arr: any = [];
    const order_array = JSON.parse(data.order_array);
    const order_arr: any = [];
    const change_array = JSON.parse(data.change_array);
    const change_arr: any = [];
    const query: any = [];
    const customer_name = data.customer_name;
    const phone = data.phone;
    const date = Utils.toSqlDate(new Date());
    payment_array.forEach((payment: any) => {
      payment.id = uuid.v4();
      payment.sale_diamond_id = data.id;
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
      item.sale_diamond_id = data.id;
      item = comfunc.fillDefaultFields(item);
      item_arr.push(item);
      query.push(RestApi.getDb("item").where("id", item.item_id).update({"is_stock": 0, "is_sale": 1, "sale_date": date, "updateddate": Utils.toSqlDate(new Date())}));
    });
    order_array.forEach((order: any) => {
      let ord: any = {
        id: uuid.v4(),
        sale_id: data.id,
        order_id: order.order_diamond_id,
        type: "diamond"
      };
      ord = comfunc.fillDefaultFields(ord);
      order_arr.push(ord);
      query.push(RestApi.getDb("order_diamond").where("id", order.order_diamond_id).update({"is_active": 0, "updateddate": Utils.toSqlDate(new Date())}));
    });
    change_array.forEach((change: any) => {
      let chg: any = {
        id: uuid.v4(),
        sale_id: data.id,
        change_id: change.change_diamond_id,
      }
      chg = comfunc.fillDefaultFields(chg);
      change_arr.push(chg);
      query.push(RestApi.getDb("change_diamond").where("id", change.change_diamond_id).update({"is_active": 0, "updateddate": Utils.toSqlDate(new Date())}));
    });
    delete (data.payment_array);
    delete (data.item_array);
    delete (data.order_array);
    delete (data.change_array);
    delete (data.customers);
    delete (data.items);
    delete (data.customer_code);
    delete (data.customer_name);
    delete (data.phone);
    if (data.is_order == 1) {
      query.push(RestApi.getKnex().batchInsert("sale_order", order_arr));
    }
    if (data.is_change == 1) {
      query.push(RestApi.getKnex().batchInsert("sale_change", change_arr));
    }
    RestApi.getDb("autogenerate").select("*").where("prefix", "SD")
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
          return RestApi.getDb("autogenerate").where("prefix", "SD").update({ "currentvalue": count, "lastdate": datecode, "updateddate": date }, "id") as PromiseLike<any>;
        }
      })
      .then((result) => {
        return RestApi.getKnex().batchInsert("sale_diamond_payment", payment_arr);
      })
      .then((result) => {
        if (data.is_debt == 1) {
          let customer_debt: any = {
            id: uuid.v4(),
            date: Utils.toSqlDate(new Date()),
            customer_id: data.customer_id,
            sale_diamond_id: data.id,
            sale_gold_id: null,
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
          const subtotal = 0;
          let daily_cash: any = {
            id: uuid.v4(),
            date: Utils.toSqlDate(new Date()),
            type_id: data.id,
            // cash_in: Number(data.subtotal) - Number(data.debt_amount),
            cash_in: 0,
            status: "sale",
            type: "sale_diamond",
            user_id: req.user.id,
            sale_person_id: data.sale_person_id
          };
          if (Number(data.subtotal) < 0) {
            daily_cash.cash_in = 0;
            daily_cash.cash_out = Math.abs(data.subtotal);
            let cash_in: any = {
              id: uuid.v4(),
              date: date,
              daily_cash_in_type_id: "5056908a-7b95-4b1b-968e-23694fbe531d",
              title: "Diamond Sale",
              total_amount: cash_amount,
              bank_amount: data.bank_amount,
              cash_amount: data.cash_amount,
              type_id: data.id,
              status: "sale_diamond"
            }
            cash_in = comfunc.fillDefaultFields(cash_in);
            query.push(RestApi.getDb("daily_usage_showroom").insert(cash_in, "id"));
          } else {
            daily_cash.cash_in = cash_amount;
            let cash_in: any = {
              id: uuid.v4(),
              date: date,
              daily_cash_in_type_id: "5056908a-7b95-4b1b-968e-23694fbe531d",
              title: "Diamond Sale",
              total_amount: cash_amount,
              bank_amount: data.bank_amount,
              cash_amount: data.cash_amount,
              type_id: data.id,
              status: "sale_diamond"
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
        return RestApi.getDb("sale_diamond").insert(data, "id");
      })
      .then((result) => {
        return RestApi.getKnex().batchInsert("sale_diamond_items", item_arr);
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
    const postUrl = `/sale-diamond/edit/${data.id}`;
    let params: any = { title: config.appname, user: req.user.username, postUrl: postUrl, listUrl: "/sale-diamond" };
    params = Permission.getMenuParams(params, req, res);

    RestApi.getDb("sale_diamond")
      .leftJoin("customer", "customer_id", "customer.id")
      // .leftJoin("order_diamond", "order_diamond_id", "order_diamond.id")
      // .leftJoin("change_diamond", "change_diamond_id", "change_diamond.id")
      .where({ "sale_diamond.id": data.id })
      .select("sale_diamond.*", "customer.code as customer_code", "customer.customer_name", "customer.phone")
      .then((result) => {
        result[0].date = Utils.toDisplayDate(result[0].date);
        result[0].total_amount = Utils.addComma(result[0].total_amount);
        result[0].subtotal = Utils.addComma(result[0].subtotal);
        result[0].debt_amount = Utils.addComma(result[0].debt_amount);
        params.params = Utils.mixin(data, result[0]);
        return RestApi.getDb("sale_diamond_payment").leftJoin("bank", "bank_id", "bank.id").where("sale_diamond_id", data.id).select("sale_diamond_payment.*", "bank.bank_name", "bank.account");
      })
      .then((result) => {
        if (result && result.length > 0) {
          result.forEach((payment) => {
            payment.amount = Utils.addComma(payment.amount);
          });
        }
        params.payment_array = result;
        return RestApi.getDb("sale_diamond_items").leftJoin("item", "item_id", "item.id").where("sale_diamond_id", data.id).select("sale_diamond_items.*", "item.code", "item.item_name");
      })
      .then((result) => {
        if (result && result.length > 0) {
          result.forEach((item) => {
            item.price = Utils.addComma(item.price);
          });
        }
        params.item_array = result;
        return RestApi.getDb("order_diamond").leftJoin("sale_order", "order_diamond.id", "order_id").where({"sale_id": data.id, "type": "diamond"}).select("voc_no as order_voc_no", "total_amount as order_amount", "description as order_description");
      })
      .then((result) => {
        if (result && result.length > 0) {
          result.forEach((order) => {
            order.order_amount = Utils.addComma(order.order_array);
          });
        }
        params.order_array = result;
        return RestApi.getDb("change_diamond").leftJoin("sale_change", "change_diamond.id", "change_id").where("sale_id", data.id).select("voc_no as change_voc_no", "total_amount as change_amount");
      })
      .then((result) => {
        if (result && result.length > 0) {
          result.forEach((change) => {
            change.change_amount = Utils.addComma(change.change_array);
          });
        }
        params.change_array = result;
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
        return RestApi.getDb("item").whereIn("status", ["diamond", "pt"]).where("is_stock", 1).select();
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
        res.render("dashboard/sale-diamond-entry", params);
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
    if (data.is_change == "on" || data.is_change == "1") {
      data.is_change = 1;
    }
    else {
      data.is_change = 0;
    }
    if (data.is_debt == "on" || data.is_debt == "1") {
      data.is_debt = 1;
    }
    else {
      data.is_debt = 0;
    }
    data.total_amount = Utils.removeComma(data.total_amount);
    data.subtotal = Utils.removeComma(data.subtotal);
    data.debt_amount = Utils.removeComma(data.debt_amount);
    data.profit_amount = Utils.removeComma(data.profit_amount);
    data.pay_amount = Number(data.total_amount) - (Number(data.discount_amount ) + Number(data.debt_amount));
    const payment_array = JSON.parse(data.payment_array);
    const payment_arr: any = [];
    const item_array = JSON.parse(data.item_array);
    const item_arr: any = [];
    const order_array = JSON.parse(data.order_array);
    const order_arr: any = [];
    const change_array = JSON.parse(data.change_array);
    const change_arr: any = [];
    const daily_cash: any = {};
    const query: any = [];
    const date = Utils.toSqlDate(new Date);
    query.push(RestApi.getDb("daily_cash_payment").where({"cash_id": data.id, "type": "cash_in_showroom"}).delete());
    query.push(RestApi.getDb("daily_cash_in_showroom").where({"type_id": data.id, "status": "sale_diamond"}).delete());
    query.push(RestApi.getDb("daily_usage_showroom").where({"type_id": data.id, "status": "sale_diamond"}).delete());
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
        payment.sale_diamond_id = data.id;
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
        item.sale_diamond_id = data.id;
      }
      item = comfunc.fillDefaultFields(item);
      item_arr.push(item);
    });
    order_array.forEach((order: any) => {
      if (order.id && order.id != "") {
        
      } else {
        let ord: any = {
          id: uuid.v4(),
          sale_id: data.id,
          order_id: order.order_diamond_id,
          type: "diamond"
        }
        ord = comfunc.fillDefaultFields(ord);
        order_arr.push(ord);
      }
    });
    change_array.forEach((change: any) => {
      if (change.id && change.id != "") {
        
      } else {
        let chg: any = {
          id: uuid.v4(),
          sale_id: data.id,
          change_id: change.change_diamond_id
        }
        chg = comfunc.fillDefaultFields(chg);
        change_arr.push(chg);
      }
    });
    delete (data.payment_array);
    delete (data.item_array);
    delete (data.order_array);
    delete (data.change_array);
    delete (data.customers);
    delete (data.items);
    delete (data.customer_code);
    delete (data.customer_name);
    delete (data.phone);
    // delete (data.order_voc_no);
    // delete (data.change_voc_no);
    let db = RestApi.getDb("sale_diamond");
    if (Utils.isEmpty(data.id)) {
      return comfunc.sendForbidden(res);
    }

    db = db.where({ id: data.id });
    RestApi.getDb("sale_diamond")
      .where("id", data.id)
      .select()
      .first()
      .then((result) => {
        if (result) {
          if (result.is_order == 1) { // have old order record
            if (data.is_order == 1) {
              if (data.order_diamond_id != result.order_diamond_id) {
                query.push(RestApi.getDb("order_diamond").where("id", result.order_diamond_id).update({"is_active": 1, "updateddate": date}));
                query.push(RestApi.getDb("order_diamond").where("id", data.order_diamond_id).update({"is_active": 0, updateddate: date}));
              }
            } else {
              query.push(RestApi.getDb("order_diamond").where("id", result.order_diamond_id).update({"is_active": 1, "updateddate": date}));
            }
          } else { // no old order record
            if (data.is_order == 1) {
              query.push(RestApi.getDb("order_diamond").where("id", data.order_diamond_id).update({"is_active": 0, updateddate: date}));
            }
          }
          if (result.is_change == 1) {
            if (data.is_change == 1) {
              if (data.change_diamond_id != result.change_diamond_id) {
                query.push(RestApi.getDb("change_diamond").where("id", result.change_diamond_id).update({"is_active": 1, "updateddate": date}));
                query.push(RestApi.getDb("change_diamond").where("id", data.change_diamond_id).update({"is_active": 0, updateddate: date}));
              }
            } else {
              query.push(RestApi.getDb("change_diamond").where("id", result.change_diamond_id).update({"is_active": 1, "updateddate": date}));
            }
          } else {
            if (data.is_change == 1) {
              query.push(RestApi.getDb("change_diamond").where("id", data.change_diamond_id).update({"is_active": 0, updateddate: date}));
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
                type: "sale_diamond",
                user_id: req.user.id,
                sale_person_id: data.sale_person_id
              };
              daily_cash = comfunc.fillDefaultFields(daily_cash);
              query.push(RestApi.getDb("daily_cash_showroom").insert(daily_cash, "id"));
              let cash_in: any = {
                id: uuid.v4(),
                date: date,
                daily_cash_in_type_id: "5056908a-7b95-4b1b-968e-23694fbe531d",
                title: "Diamond Sale",
                total_amount: cash_amount,
                bank_amount: data.bank_amount,
                cash_amount: data.cash_amount,
                type_id: data.id,
                status: "sale_diamond"
              }
              cash_in = comfunc.fillDefaultFields(cash_in);
              query.push(RestApi.getDb("daily_cash_in_showroom").insert(cash_in, "id"));
            }
          } else { // has daily_cash_showroom old record
            if (cash_amount > 0) {
              query.push(RestApi.getDb("daily_cash_showroom").where({"type_id": data.id, "type": "sale_diamond"}).update({"cash_in": cash_amount, "updateddate": date}));
              let cash_in: any = {
                id: uuid.v4(),
                date: date,
                daily_cash_in_type_id: "5056908a-7b95-4b1b-968e-23694fbe531d",
                title: "Diamond Sale",
                total_amount: cash_amount,
                bank_amount: data.bank_amount,
                cash_amount: data.cash_amount,
                type_id: data.id,
                status: "sale_diamond"
              }
              cash_in = comfunc.fillDefaultFields(cash_in);
              query.push(RestApi.getDb("daily_cash_in_showroom").insert(cash_in, "id"));
            } else {
              query.push(RestApi.getDb("daily_cash_showroom").where({"type_id": data.id, "type": "sale_diamond"}).delete());
            }
          }
          if (result.debt_amount > 0) { // has customer_debt old record
            if (data.debt_amount > 0) {
              if (result.debt_amount != data.debt_amount) {
                query.push(RestApi.getDb("customer_debt").where("sale_diamond_id", data.id).update({amount: data.debt_amount, balance: data.debt_amount, updateddate: date}));
              }
            } else {
              query.push(RestApi.getDb("customer_debt").where("sale_diamond_id", data.id).delete());
            }
          } else { // no customer_debt old record
            let customer_debt: any = {
              id: uuid.v4(),
              date: Utils.toSqlDate(new Date()),
              customer_id: data.customer_id,
              sale_diamond_id: data.id,
              sale_gold_id: null,
              amount: data.debt_amount,
              balance: data.debt_amount
            };
            customer_debt = comfunc.fillDefaultFields(customer_debt);
            query.push(RestApi.getDb("customer_debt").insert(customer_debt, "id"));
          }
        }
        return RestApi.getDb("sale_diamond_items").where("sale_diamond_id", data.id).select();
      })
      .then((result) => {
        if (result.length > 0) {
          result.forEach((item) => {
            query.push(RestApi.getDb("item").where("id", item.item_id).update({"is_stock": 1, "is_sale": 0, updateddate: date}));
          });
        }
        item_arr.forEach((item: any) => {
          query.push(RestApi.getDb("item").where("id", item.item_id).update({"is_stock": 0, "is_sale": 1, "updateddate": date}));
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
        return RestApi.getDb("sale_diamond_payment").where("sale_diamond_id", data.id).delete();
      })
      .then((result) => {
        return RestApi.getKnex().batchInsert("sale_diamond_payment", payment_arr);
      })
      .then((result) => {
        return RestApi.getDb("sale_diamond_items").where("sale_diamond_id", data.id).delete();
      })
      .then((result) => {
        return RestApi.getKnex().batchInsert("sale_diamond_items", item_arr);
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
    let change_diamond: any = [];
    let return_diamond: any = [];
    const query: any = [];
    const date = Utils.toSqlDate(new Date());
    const user_id: any = req.user.id;
    if (Utils.isEmpty(data.id)) {
      return comfunc.sendForbidden(res);
    }
    query.push(RestApi.getDb("daily_cash_showroom").where({"type_id": data.id, "type": "sale_diamond"}).delete());
    query.push(RestApi.getDb("daily_cash_in_showroom").where({"type_id": data.id, "status": "sale_diamond"}).delete());
    query.push(RestApi.getDb("daily_usage_showroom").where({"type_id": data.id, "status": "sale_diamond"}).delete());
    query.push(RestApi.getDb("daily_cash_payment").where({"cash_id": data.id, "type": "cash_in_showroom"}).delete());
    RestApi.getDb("change_diamond_items")
      .where("sale_diamond_id", data.id)
      .select()
      .then((result) => {
        change_diamond = result;
        return RestApi.getDb("return_diamond_items").where("sale_diamond_id", data.id).select();
      })
      .then((result) => {
        return_diamond = result;
        if (change_diamond > 0 || return_diamond > 0) {
          throw new Error("Can not Delete. Already Used!");
        } else {
          return RestApi.getDb("sale_diamond").where("id", data.id).select();
        }
      })
      .then((result) => {
        if (result.length > 0) {
          // if (result[0].is_order == 1) {
          //   query.push(RestApi.getDb("order_diamond").where("id", result[0].order_diamond_id).update({"is_active": 1, "updateddate": date}));
          // }
          // if (result[0].is_change == 1) {
          //   query.push(RestApi.getDb("change_diamond").where("id", result[0].change_diamond_id).update({"is_active": 1, "updateddate": date}));
          // }
          if (result[0].is_debt == 1) {
            query.push(RestApi.getDb("customer_debt").where("sale_diamond_id", data.id).delete());
          }
        }
        return RestApi.getDb("sale_order").where({"sale_id": data.id, "type": "diamond"}).select();
      })
      .then((result) => {
        if (result && result.length > 0) {
          result.forEach((order) => {
            query.push(RestApi.getDb("order_diamond").where("id", order.order_id).update({"is_active": 1, "updateddate": date}));
          });
          query.push(RestApi.getDb("sale_order").where({"sale_id": data.id, "type": "diamond"}).delete());
        }
        return RestApi.getDb("sale_change").where("sale_id", data.id).select();
      })
      .then((result) => {
        if (result && result.length > 0) {
          result.forEach((change) => {
            query.push(RestApi.getDb("change_diamond").where("id", change.change_id).update({"is_active": 1, "updateddate": date}));
          });
          query.push(RestApi.getDb("sale_change").where("sale_id", data.id).delete());
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
                                                FROM sale_diamond_items 
                                                WHERE sale_diamond_id = '` + data.id + `')`);
      })
      .then((result) => {
        return RestApi.getDb("sale_diamond_payment").where("sale_diamond_id", data.id).update({ "is_delete": 1 });
      })
      .then((result) => {
        return RestApi.getDb("sale_diamond_items").where("sale_diamond_id", data.id).update({ "is_delete": 1 });
      })
      .then((result) => {
        return RestApi.getDb("daily_cash_showroom").where({"type_id": data.id, "status": "sale"}).delete();
      })
      .then((result) => {
        return RestApi.getDb("sale_diamond").where({ id: data.id }).update({ "is_active": 0, "is_delete": 1, "deleted_user_id": user_id, "deleted_date": Utils.toSqlDate(new Date()) });
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
    RestApi.getDb("sale_diamond")
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
          res.render("dashboard/sale-diamond-delete", params);
        })
        .catch((err: any) => {
          next(err);
        });

    } else {
      res.render("dashboard/sale-diamond-delete", params);
    }
  }

  public getCustomer(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = { id: req.params.id };
    const id = data.id;

    if (Utils.isEmpty(id)) {
      return comfunc.sendForbidden(next);
    }
    const postUrl = `/sale-diamond/customer-preview/${data.id}`;
    let params: any = { title: config.appname, user: req.user.username, postUrl: postUrl, params: data };
    // let params: any = { title: config.appname, user: req.user.username, params: data };
    params = Permission.getMenuParams(params, req, res);

    RestApi.getDb("sale_diamond")
      .leftJoin("customer", "sale_diamond.customer_id", "customer.id")
      .leftJoin("sale_person", "sale_diamond.sale_person_id", "sale_person.id")
      .where({ "sale_diamond.id": data.id })
      .select("sale_diamond.*", "customer.code as customer_code", "customer.customer_name", "customer.phone", "sale_person.sale_person_name")
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
        params.params.change_total_amount = Utils.numberWithCommas(params.params.change_total_amount);
        params.params.debt_amount = Utils.numberWithCommas(params.params.debt_amount);
        params.params.payment_amount = Utils.numberWithCommas(payment_amount);
        return RestApi.getDb("sale_diamond_items")
          .leftJoin("sale_diamond", "sale_diamond_items.sale_diamond_id", "sale_diamond.id")
          .leftJoin("item", "sale_diamond_items.item_id", "item.id")
          .where({ "sale_diamond_items.sale_diamond_id": data.id })
          .select("sale_diamond_items.*", "sale_diamond.voc_no", "item.item_name");
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
        res.render("dashboard/sale-diamond-customer-preview", params);
      })
      .catch((err) => {
        console.log(`${err}`);
        next({ "error": err });
      });
  }

  public getShop(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = { id: req.params.id };
    const id = data.id;

    if (Utils.isEmpty(id)) {
      return comfunc.sendForbidden(next);
    }
    const postUrl = `/sale-diamond/shop-preview/${data.id}`;
    let params: any = { title: config.appname, user: req.user.username, postUrl: postUrl, params: data };
    params = Permission.getMenuParams(params, req, res);

    RestApi.getDb("sale_diamond")
      .leftJoin("customer", "sale_diamond.customer_id", "customer.id")
      .leftJoin("sale_person", "sale_diamond.sale_person_id", "sale_person.id")
      .where({ "sale_diamond.id": data.id })
      .select("sale_diamond.*", "customer.code as customer_code", "customer.customer_name", "customer.phone", "sale_person.sale_person_name")
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
        params.params.change_total_amount = Utils.numberWithCommas(params.params.change_total_amount);
        params.params.profit_amount = Utils.numberWithCommas(params.params.profit_amount);
        params.params.debt_amount = Utils.numberWithCommas(params.params.debt_amount);
        params.params.payment_amount = Utils.numberWithCommas(payment_amount);
        return RestApi.getDb("sale_diamond_items")
          .leftJoin("item", "sale_diamond_items.item_id", "item.id")
          .where({ "sale_diamond_items.sale_diamond_id": data.id })
          .select("sale_diamond_items.*", "item.item_name");
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
        res.render("dashboard/sale-diamond-shop-preview", params);
      })
      .catch((err) => {
        console.log(`${err}`);
        next({ "error": err });
      });
  }
}

export default new SaleDiamondRouter();