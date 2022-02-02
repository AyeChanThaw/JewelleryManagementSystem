/**
 * Daily Usage Routes
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

class DailyUsageRouter extends ExpressRouter {
  constructor() {
    super();

    this.route("/daily-usage").all(Permission.onLoad).get(this.getList);
    this.route("/daily-usage/entry").all(Permission.onLoad).get(this.getEntry).post(this.postEntry);
    this.route("/daily-usage/edit/:id").all(Permission.onLoad).get(this.getEdit).post(this.postEdit);
    this.route("/daily-usage/delete/:id").all(Permission.onLoad).post(this.postDelete);
    this.route("/daily-usage-showroom").all(Permission.onLoad).get(this.getShowroomList);
    this.route("/daily-usage-showroom/entry").all(Permission.onLoad).get(this.getShowroomEntry).post(this.postShowroomEntry);
    this.route("/daily-usage-showroom/edit/:id").all(Permission.onLoad).get(this.getShowroomEdit).post(this.postShowroomEdit);
    this.route("/daily-usage-showroom/delete/:id").all(Permission.onLoad).post(this.postShowroomDelete);
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
          res.render("dashboard/daily-usage", params);
        })
        .catch((err: any) => {
          next(err);
        });

    } else {
      res.render("dashboard/daily-usage", params);
    }
  }

  public getEntry(req: express.Request, res: express.Response, next: express.NextFunction) {
    let params: any = { title: config.appname, user: req.user.username, postUrl: "/daily-usage/entry", params: {}, listUrl: "/daily-usage" };
    params = Permission.getMenuParams(params, req, res);

    if (typeof (<any>req).jwtToken == "function") {
      (<any>req).jwtToken(jwtCredentialId)
        .then((result: string) => {
          params.token = result;
          params.payment_array = [];
          params.params.date = moment(new Date()).format("DD/MM/YYYY");
          res.render("dashboard/daily-usage-entry", params);
        })
        .catch((err: any) => {
          next(err);
        });

    } else {
      res.render("dashboard/daily-usage-entry", params);
    }
  }

  public postEntry(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = comfunc.fillDefaultFields(req.body);
    data.date = Utils.toSqlDate(data.date);
    data.id = uuid.v4();
    data.total_amount = Utils.removeComma(data.total_amount);
    data.cash_amount = 0;
    data.bank_amount = 0;
    const payment_array = JSON.parse(data.payment_array);
    const payment_arr: any = [];
    let cash: any = {};
    payment_array.forEach((payment: any) => {
      payment.id = uuid.v4();
      payment.cash_id = data.id;
      delete payment.account;
      if (payment.payment_type == "bank") {
        data.bank_amount += Number(payment.amount);
      } else {
        data.cash_amount += Number(payment.amount);
      }
      payment = comfunc.fillDefaultFields(payment);
      payment_arr.push(payment);
    });
    delete (data.payment_array);

    const db = RestApi.getDb("daily_usage");
    db.insert(data, "id")
      .then((result) => {
        cash.id = uuid.v4();
        cash.date = Utils.toSqlDate(new Date()),
        cash.type_id = data.id;
        cash.cash_out = data.amount;
        cash.status = "daily_usage";
        cash.type = "daily_usage";
        cash.user_id = req.user.id;
        cash = comfunc.fillDefaultFields(cash);

        return RestApi.getDb("daily_cash").insert(cash, "id");
      })
      .then((result) => {
        return RestApi.getKnex().batchInsert("daily_cash_payment", payment_arr);
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
    const postUrl = `/daily-usage/edit/${data.id}`;
    let params: any = { title: config.appname, user: req.user.username, postUrl: postUrl, listUrl: "/daily-usage" };
    params = Permission.getMenuParams(params, req, res);

    RestApi.getDb("daily_usage").where({ id: data.id }).select()
      .then((result) => {
        result[0].date = Utils.toDisplayDate(result[0].date);
        result[0].total_amount = Utils.addComma(result[0].total_amount);
        params.params = Utils.mixin(data, result[0]);

        return RestApi.getDb("daily_cash_payment").leftJoin("bank", "bank_id", "bank.id").where({"cash_id": data.id, "type": "usage"}).select("daily_cash_payment.*", "bank.bank_name", "bank.account");
      })
      .then((result) => {
        if (result && result.length > 0) {
          result.forEach((payment) => {
            payment.amount = Utils.addComma(payment.amount);
          });
        }
        params.payment_array = result;

        if (typeof (<any>req).jwtToken == "function") {
          return (<any>req).jwtToken(jwtCredentialId);
        } else {
          return Promise.resolve("");
        }
      })
      .then((result) => {
        params.token = result;
        res.render("dashboard/daily-usage-entry", params);
      })
      .catch((err) => {
        console.log(`${err}`);
        next({ "error": err });
      });
  }

  public postEdit(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = comfunc.fillDefaultFields(req.body);
    data.total_amount = Utils.removeComma(data.total_amount);
    data.cash_amount = 0;
    data.bank_amount = 0;
    const id = data.id;
    data.date = Utils.toSqlDate(data.date);
    data.updateddate = Utils.toSqlDate(new Date());
    const payment_array = JSON.parse(data.payment_array);
    const payment_arr: any = [];
    const date = Utils.toSqlDate(new Date);
    payment_array.forEach((payment: any) => {
      if (payment.id && payment.id != "") {
        payment.createddate = date;
        payment.updateddate = date;
        payment.amount = Utils.removeComma(payment.amount);
        delete payment.account;
        delete payment.bank_name;
      } else {
        payment.id = uuid.v4();
        delete payment.account;
        payment = comfunc.fillDefaultFields(payment);
        payment.cash_id = data.id;
      }
      if (payment.payment_type == "bank") {
        data.bank_amount += Number(payment.amount);
      } else {
        data.cash_amount += Number(payment.amount);
      }
      payment_arr.push(payment);
    });
    delete (data.payment_array);
    let db = RestApi.getDb("daily_usage");
    if (Utils.isEmpty(data.id)) {
      return comfunc.sendForbidden(res);
    }

    db = db.where({ id: id });
    delete (data.id);
    db.update(data, "id")
      .then((result) => {
        return RestApi.getDb("daily_cash").where("type_id", id).update({ "cash_out": data.amount, "updateddate": Utils.toSqlDate(new Date()) }, "id");
      })
      .then((result) => {
        return RestApi.getDb("daily_cash_payment").where({"cash_id": id,"type": "usage"}).delete();
      })
      .then((result) => {
        return RestApi.getKnex().batchInsert("daily_cash_payment", payment_arr);
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
    if (Utils.isEmpty(data.id)) {
      return comfunc.sendForbidden(res);
    }
    let db = RestApi.getDb("daily_usage");
    db = db.where({ id: data.id });
    RestApi.getDb("daily_cash")
            .where("type_id", data.id)
            .delete()
            .then((result) => {
              return db.delete("id");
            })
            .then((result) => {
              return RestApi.getDb("daily_cash_payment").where({"cash_id": data.id, "type": "usage"}).delete();
            })
            .then((result) => {
                res.json({ "success": result });
            })
            .catch((err) => {
                console.log(`${err}`);
                res.json({ "error": err });
            });
  }

  public getShowroomList(req: express.Request, res: express.Response, next: express.NextFunction) {
    let params: any = { title: config.appname, user: req.user.username };
    params = Permission.getMenuParams(params, req, res);
    if (typeof (<any>req).jwtToken == "function") {
      (<any>req).jwtToken(jwtCredentialId)
        .then((result: string) => {
          params.token = result;
          res.render("dashboard/daily-usage-showroom", params);
        })
        .catch((err: any) => {
          next(err);
        });

    } else {
      res.render("dashboard/daily-usage-showroom", params);
    }
  }

  public getShowroomEntry(req: express.Request, res: express.Response, next: express.NextFunction) {
    let params: any = { title: config.appname, user: req.user.username, postUrl: "/daily-usage-showroom/entry", params: {}, listUrl: "/daily-usage-showroom" };
    params = Permission.getMenuParams(params, req, res);

    if (typeof (<any>req).jwtToken == "function") {
      (<any>req).jwtToken(jwtCredentialId)
        .then((result: string) => {
          params.token = result;
          params.payment_array = [];
          params.params.date = moment(new Date()).format("DD/MM/YYYY");
          res.render("dashboard/daily-usage-showroom-entry", params);
        })
        .catch((err: any) => {
          next(err);
        });

    } else {
      res.render("dashboard/daily-usage-showroom-entry", params);
    }
  }

  public postShowroomEntry(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = comfunc.fillDefaultFields(req.body);
    data.date = Utils.toSqlDate(data.date);
    data.id = uuid.v4();
    data.total_amount = Utils.removeComma(data.total_amount);
    data.cash_amount = 0;
    data.bank_amount = 0;
    const payment_array = JSON.parse(data.payment_array);
    const payment_arr: any = [];
    let cash: any = {};
    payment_array.forEach((payment: any) => {
      payment.id = uuid.v4();
      payment.cash_id = data.id;
      delete payment.account;
      if (payment.payment_type == "bank") {
        data.bank_amount += Number(payment.amount);
      } else {
        data.cash_amount += Number(payment.amount);
      }
      payment = comfunc.fillDefaultFields(payment);
      payment_arr.push(payment);
    });
    delete (data.payment_array);

    const db = RestApi.getDb("daily_usage_showroom");
    db.insert(data, "id")
      .then((result) => {
        cash.id = uuid.v4();
        cash.date = Utils.toSqlDate(new Date()),
        cash.type_id = data.id;
        cash.cash_out = data.amount;
        cash.status = "daily_usage_showroom";
        cash.type = "daily_usage_showroom";
        cash.user_id = req.user.id;
        cash = comfunc.fillDefaultFields(cash);

        return RestApi.getDb("daily_cash_showroom").insert(cash, "id");
      })
      .then((result) => {
        return RestApi.getKnex().batchInsert("daily_cash_payment", payment_arr);
      })
      .then((result) => {
        res.json({ "success": result });
      })
      .catch((err) => {
        console.log(`${err}`);
        res.json({ "error": err });
      });
  }

  public getShowroomEdit(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = { id: req.params.id };
    if (Utils.isEmpty(data.id)) {
      return comfunc.sendForbidden(next);
    }
    const postUrl = `/daily-usage-showroom/edit/${data.id}`;
    let params: any = { title: config.appname, user: req.user.username, postUrl: postUrl, listUrl: "/daily-usage-showroom" };
    params = Permission.getMenuParams(params, req, res);

    RestApi.getDb("daily_usage_showroom").where({ id: data.id }).select()
      .then((result) => {
        result[0].date = Utils.toDisplayDate(result[0].date);
        result[0].total_amount = Utils.addComma(result[0].total_amount);
        params.params = Utils.mixin(data, result[0]);

        return RestApi.getDb("daily_cash_payment").leftJoin("bank", "bank_id", "bank.id").where({"cash_id": data.id, "type": "usage_showroom"}).select("daily_cash_payment.*", "bank.bank_name", "bank.account");
      })
      .then((result) => {
        if (result && result.length > 0) {
          result.forEach((payment) => {
            payment.amount = Utils.addComma(payment.amount);
          });
        }
        params.payment_array = result;

        if (typeof (<any>req).jwtToken == "function") {
          return (<any>req).jwtToken(jwtCredentialId);
        } else {
          return Promise.resolve("");
        }
      })
      .then((result) => {
        params.token = result;
        res.render("dashboard/daily-usage-showroom-entry", params);
      })
      .catch((err) => {
        console.log(`${err}`);
        next({ "error": err });
      });
  }

  public postShowroomEdit(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = comfunc.fillDefaultFields(req.body);
    const id = data.id;
    data.date = Utils.toSqlDate(data.date);
    data.updateddate = Utils.toSqlDate(new Date());
    data.total_amount = Utils.removeComma(data.total_amount);
    data.cash_amount = 0;
    data.bank_amount = 0;
    const payment_array = JSON.parse(data.payment_array);
    const payment_arr: any = [];
    const date = Utils.toSqlDate(new Date);
    payment_array.forEach((payment: any) => {
      if (payment.id && payment.id != "") {
        payment.createddate = date;
        payment.updateddate = date;
        payment.amount = Utils.removeComma(payment.amount);
        delete payment.account;
        delete payment.bank_name;
      } else {
        payment.id = uuid.v4();
        delete payment.account;
        payment = comfunc.fillDefaultFields(payment);
        payment.cash_id = data.id;
      }
      if (payment.payment_type == "bank") {
        data.bank_amount += Number(payment.amount);
      } else {
        data.cash_amount += Number(payment.amount);
      }
      payment_arr.push(payment);
    });
    delete (data.payment_array);
    let db = RestApi.getDb("daily_usage_showroom");
    if (Utils.isEmpty(data.id)) {
      return comfunc.sendForbidden(res);
    }

    db = db.where({ id: id });
    delete (data.id);
    db.update(data, "id")
      .then((result) => {
        return RestApi.getDb("daily_cash_showroom").where("type_id", id).update({ "cash_out": data.amount, "updateddate": Utils.toSqlDate(new Date()) }, "id");
      })
      .then((result) => {
        return RestApi.getDb("daily_cash_payment").where({"cash_id": id,"type": "usage_showroom"}).delete();
      })
      .then((result) => {
        return RestApi.getKnex().batchInsert("daily_cash_payment", payment_arr);
      })
      .then((result) => {
        res.json({ "success": result });
      })
      .catch((err) => {
        console.log(`${err}`);
        res.json({ "error": err });
      });
  }

  public postShowroomDelete(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = { id: req.params.id };
    if (Utils.isEmpty(data.id)) {
      return comfunc.sendForbidden(res);
    }
    let db = RestApi.getDb("daily_usage_showroom");
    db = db.where({ id: data.id });
    RestApi.getDb("daily_cash_showroom")
            .where("type_id", data.id)
            .delete()
            .then((result) => {
              return db.delete("id");
            })
            .then((result) => {
              return RestApi.getDb("daily_cash_payment").where({"cash_id": data.id, "type": "usage_showroom"}).delete();
            })
            .then((result) => {
                res.json({ "success": result });
            })
            .catch((err) => {
                console.log(`${err}`);
                res.json({ "error": err });
            });
  }
}

export default new DailyUsageRouter();