/**
 * Purchase Routes
 */
import * as express from "express";
import { ExpressRouter } from "../../lib/express-application";
import { Utils } from "../../lib/utils";
import config from "../../../data/config.json";
import * as RestApi from "../../lib/restapi";
import * as comfunc from "../../lib/comfunc";
import * as uuid from "uuid";
import { Permission } from "../../lib/permission";

const jwtCredentialId = config.jwt.defCredentialId;

class PurchaseRouter extends ExpressRouter {
  constructor() {
    super();

    this.route("/purchase").all(Permission.onLoad).get(this.getList);
    this.route("/purchase/entry").all(Permission.onLoad).get(this.getEntry).post(this.postEntry);
    this.route("/purchase/edit/:id").all(Permission.onLoad).get(this.getEdit).post(this.postEdit);
    this.route("/purchase/delete/:id").all(Permission.onLoad).post(this.postDelete);
    this.route("/stock-dataentry").all(Permission.onLoad).get(this.getDataList);
    this.route("/stock-dataentry/edit/:id").all(Permission.onLoad).get(this.getDataEdit).post(this.postDataEdit);
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
          res.render("dashboard/purchase", params);
        })
        .catch((err: any) => {
          next(err);
        });

    } else {
      res.render("dashboard/purchase", params);
    }
  }

  public getEntry(req: express.Request, res: express.Response, next: express.NextFunction) {
    let params: any = { title: config.appname, postUrl: "/purchase/entry", params: {}, listUrl: "/purchase" };
    params = Permission.getMenuParams(params, req, res);
    params.params.cashier_name = req.user.username;
    params.params.cashier_id = req.user.id;
    const prefix = "P";
    const prefix2 = "M";
    let count = 0, count2 = 0;
    const datecode = Utils.toGeneratecodeDate(new Date());
    RestApi.getDb("autogenerate")
      .select("*")
      .where("prefix", prefix)
      .then((result) => {
        if (result[0].lastdate == datecode) {
          count = result[0].currentvalue + 1;
        } else {
          count++;
          result[0].lastdate = datecode;
        }
        result[0].currentvalue = count;
        result[0].lastdate = Utils.toGeneratecodeDate(new Date());
        result[0].updateddate = Utils.toSqlDate(new Date());
        const autogenId = result[0].id;
        delete (result[0].id);
        const voc_no = prefix + datecode + count;
        params.params.voc_no = voc_no;
        return RestApi.getDb("autogenerate").select("*").where("prefix", prefix2);
      })
      .then((result) => {
        if (result[0].lastdate == datecode) {
          count2 = result[0].currentvalue + 1;
        } else {
          count2++;
          result[0].lastdate = datecode;
        }
        result[0].currentvalue = count2;
        result[0].lastdate = Utils.toGeneratecodeDate(new Date());
        result[0].updateddate = Utils.toSqlDate(new Date());
        const autogenId = result[0].id;
        delete (result[0].id);
        const mo_code = prefix2 + datecode + count2;
        params.params.mo_code = mo_code;
      })
      .then((result) => {
        if (typeof (<any>req).jwtToken == "function") {
          (<any>req).jwtToken(jwtCredentialId)
            .then((result: string) => {
              params.token = result;
              res.render("dashboard/purchase-entry", params);
            })
            .catch((err: any) => {
              next(err);
            });
        } else {
          res.render("dashboard/purchase-entry", params);
        }
      })
      .catch((err) => {
        console.log("err ", err);
        res.render("dashboard/purchase-entry", params);
      });
  }

  public postEntry(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = comfunc.fillDefaultFields(req.body);
    const currentdate = Utils.toSqlDate(new Date());
    data.purchase_date = Utils.toSqlDate(data.purchase_date);
    data.paymenttype = "cash";
    data.id = uuid.v4();
    delete (data.cashier_name);
    if (data.paymenttype == "cash")
      data.debtprice = 0;
    else
      data.debtprice = data.netamount;

    // generate MoCode depends on mo gram
    if (data.mo_gm < 1)
      data.mo_code = "";
    else {
      data.mo_gm_balance = data.mo_gm;
      RestApi.getDb("autogenerate").select("*").where("prefix", "M")
        .then((result) => {
          const datecode = Utils.toGeneratecodeDate(new Date());
          let count2 = 0;
          let autogenresult: any = [];
          if (result[0].lastdate == datecode) {
            count2 = result[0].currentvalue + 1;
          } else {
            count2++;
            result[0].lastdate = datecode;
          }
          result[0].currentvalue = count2;
          result[0].lastdate = Utils.toGeneratecodeDate(new Date());
          result[0].updateddate = currentdate;
          autogenresult = result[0];
          const autogenId = result[0].id;
          delete (result[0].id);

          if (result[0].lastdate == datecode) {
            return RestApi.getDb("autogenerate").where("id", autogenId).update(result[0], "id") as PromiseLike<any>;
          } else {
            return RestApi.getDb("autogenerate").insert(autogenresult) as PromiseLike<any>;
          }
        })
        .then((result) => {
          console.log("mocode result ", result);
        })
        .catch((error) => {
          console.log("mocode ", error);
        });
    }

    const query: any = [];
    let debt: any = {};
    const daily_cash: any = {};
    const daily_usage: any = {};
    const payment: any = {};

    if (data.finished) {
      if (data.paymenttype == "debt") {
        debt.id = uuid.v4();
        debt.date = currentdate;
        debt.supplier_id = data.supplier_id;
        debt.purchase_id = data.id;
        debt.user_id = req.user.id;
        debt.currency = "MMK";
        debt.amount = data.netamount;
        debt.balance = data.netamount;
        debt = comfunc.fillDefaultFields(debt);
        query.push(RestApi.getDb("debt").insert(debt, "id"));
        query.push(RestApi.getDb("supplier").where("id", data.supplier_id).increment("pay_mmk", data.netamount));
      } else {
        daily_cash.id = uuid.v4();
        daily_cash.date = currentdate;
        daily_cash.type_id = data.id;
        daily_cash.cash_out = data.netamount;
        daily_cash.status = "purchase";
        daily_cash.type = "purchase";
        daily_cash.user_id = req.user.id;
        daily_cash.createddate = currentdate;
        daily_cash.updateddate = currentdate;
        query.push(RestApi.getDb("daily_cash").insert(daily_cash, "id"));

        daily_usage.id = uuid.v4();
        daily_usage.date = currentdate;
        daily_usage.daily_cash_type_id = "2260e052-6944-4984-a26f-35388fc0f6ed";
        daily_usage.title = "Purchase";
        daily_usage.total_amount = data.netamount;
        daily_usage.cash_amount = data.netamount;
        daily_usage.createddate = currentdate;
        daily_usage.updateddate = currentdate;
        query.push(RestApi.getDb("daily_usage").insert(daily_usage, "id"));

        payment.id = uuid.v4();
        payment.cash_id = daily_usage.id;
        payment.amount = data.netamount;
        payment.payment_type = "cash";
        payment.type = "usage";
        payment.createddate = currentdate;
        payment.updateddate = currentdate;
        query.push(RestApi.getDb("daily_cash_payment").insert(payment, "id"));
      }

      RestApi.getDb("purchase").insert(data, "id")
      .then((result) => {
        // if (data.paymenttype == "debt") {
        //   return Promise.all(query);
        // } else {
        //   return RestApi.getDb("daily_cash").insert(daily_cash, "id");
        // }
        return Promise.all(query);
      })
      .then((result) => {
        return RestApi.getDb("stock").select().first();
      })
      .then((stock_result) => {
        if (stock_result) {
          stock_result.gold_total_gm += parseFloat(data.gold_gm);
          stock_result.brass_total_gm += parseFloat(data.brass_gm);
          stock_result.silver_total_gm += parseFloat(data.silver_gm);
          stock_result.mo_total_gm += parseFloat(data.mo_gm);
          stock_result.updateddate = Utils.toSqlDate(new Date());
          return RestApi.getDb("stock").where("id", stock_result.id).update(stock_result, "id");
        } else {
          const stock_data = {
            id: uuid.v4(),
            gold_total_gm: parseFloat(data.gold_gm),
            brass_total_gm: parseFloat(data.brass_gm),
            silver_total_gm: parseFloat(data.silver_gm),
            mo_total_gm: parseFloat(data.mo_gm),
            createddate: Utils.toSqlDate(new Date()),
            updateddate: Utils.toSqlDate(new Date())
          };
          return RestApi.getDb("stock").insert(stock_data);
        }
      })
      .then((result) => {
        const prefix = "P";
        return RestApi.getDb("autogenerate")
        .select("*")
        .where("prefix", prefix);
      })
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
        const autogenId = result[0].id;
        delete (result[0].id);

        if (result[0].lastdate == datecode) {
          return RestApi.getDb("autogenerate").where("id", autogenId).update(result[0], "id") as PromiseLike<any>;
        } else {
          return RestApi.getDb("autogenerate").insert(autogenresult) as PromiseLike<any>;
        }
      })
      .then((result) => {
        res.json({ "success": result });
      })
      .catch((err) => {
        console.log(`${err}`);
        res.json({ "error": err });
      });
    } else {
      RestApi.getDb("purchase").insert(data, "id")
      .then((result) => {
        data.data = result;
        const prefix = "P";
        return RestApi.getDb("autogenerate")
        .select("*")
        .where("prefix", prefix);
      })
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
        const autogenId = result[0].id;
        delete (result[0].id);

        if (result[0].lastdate == datecode) {
          return RestApi.getDb("autogenerate").where("id", autogenId).update(result[0], "id") as PromiseLike<any>;
        } else {
          return RestApi.getDb("autogenerate").insert(autogenresult) as PromiseLike<any>;
        }
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

  public getEdit(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = { id: req.params.id };
    if (Utils.isEmpty(data.id)) {
      return comfunc.sendForbidden(next);
    }
    let purchase_data: any;
    const prefix2 = "M";
    let count = 0;
    const datecode = Utils.toGeneratecodeDate(new Date());
    const postUrl = `/purchase/edit/${data.id}`;
    let params: any = { title: config.appname, user: req.user.username, postUrl: postUrl, listUrl: "/purchase" };
    params = Permission.getMenuParams(params, req, res);

    RestApi.getDb("purchase").where({ "purchase.id": data.id }).select("purchase.*", "user.username")
    .leftJoin("user", "user.id", "purchase.cashier_id")
      .then((result) => {
        purchase_data = result;
        result[0].cashier_name = result[0].username;

        result[0].purchase_date = Utils.toDisplayDate(result[0].purchase_date);
        params.params = Utils.mixin(data, result[0]);
      })
      .then((result) => {
        params.goldrate = result;
        return RestApi.getDb("autogenerate").select("*").where("prefix", prefix2);
      })
      .then((result) => {
        if (!purchase_data[0].mo_code && purchase_data[0].finished !== "Yes") {
          if (result[0].lastdate == datecode) {
            count = result[0].currentvalue + 1;
          } else {
            count++;
            result[0].lastdate = datecode;
          }
          result[0].currentvalue = count;
          result[0].lastdate = Utils.toGeneratecodeDate(new Date());
          result[0].updateddate = Utils.toSqlDate(new Date());
          const autogenId = result[0].id;
          delete (result[0].id);
          const mo_code = prefix2 + datecode + count;
          params.params.mo_code = mo_code;
        }
        if (typeof (<any>req).jwtToken == "function") {
          return (<any>req).jwtToken(jwtCredentialId);
        } else {
          return Promise.resolve("");
        }
      })
      .then((result) => {
        params.token = result;
        res.render("dashboard/purchase-entry", params);
      })
      .catch((err) => {
        console.log(`${err}`);
        next({ "error": err });
      });
  }

  public postEdit(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = comfunc.fillDefaultFields(req.body);
    const currentdate = Utils.toSqlDate(new Date());
    if (Utils.isEmpty(data.id)) {
      return comfunc.sendForbidden(res);
    }
    delete (data.cashier_name);
    data.purchase_date = Utils.toSqlDate(data.purchase_date);
    data.updateddate = currentdate;
    data.paymenttype = "cash";
    if (data.paymenttype == "cash")
      data.debtprice = 0;
    else
      data.debtprice = data.netamount;

    // generate MoCode depends on mo gram
    if (data.mo_gm < 1)
      data.mo_code = "";
    else {
      data.mo_gm_balance = data.mo_gm;
      RestApi.getDb("purchase").select("mo_code").where("id", data.id).first()
      .then((result) => {
        if (!result.mo_code) {
          RestApi.getDb("autogenerate").select("*").where("prefix", "M")
          .then((result) => {
            const datecode = Utils.toGeneratecodeDate(new Date());
            let count2 = 0;
            let autogenresult: any = [];
            if (result[0].lastdate == datecode) {
              count2 = result[0].currentvalue + 1;
            } else {
              count2++;
              result[0].lastdate = datecode;
            }
            result[0].currentvalue = count2;
            result[0].lastdate = Utils.toGeneratecodeDate(new Date());
            result[0].updateddate = currentdate;
            autogenresult = result[0];
            const autogenId = result[0].id;
            delete (result[0].id);

            if (result[0].lastdate == datecode) {
              return RestApi.getDb("autogenerate").where("id", autogenId).update(result[0], "id") as PromiseLike<any>;
            } else {
              return RestApi.getDb("autogenerate").insert(autogenresult) as PromiseLike<any>;
            }
          })
          .then((result) => {
            console.log("mocode result ", result);
          })
          .catch((error) => {
            console.log("mocode ", error);
          });
        }
      })
      .catch((error) => {
        console.log("mocode ", error);
      });
    }

    const query: any = [];
    let debt: any = {};
    const daily_cash: any = {};
    const daily_usage: any = {};
    const payment: any = {};

    if (data.finished) {
      if (data.paymenttype == "debt") {
        debt.id = uuid.v4();
        debt.date = currentdate;
        debt.supplier_id = data.supplier_id;
        debt.purchase_id = data.id;
        debt.user_id = req.user.id;
        debt.currency = "MMK";
        debt.amount = data.netamount;
        debt.balance = data.netamount;
        debt = comfunc.fillDefaultFields(debt);
        query.push(RestApi.getDb("debt").insert(debt, "id"));
        query.push(RestApi.getDb("supplier").where("id", data.supplier_id).increment("pay_mmk", data.netamount));
      } else {
        daily_cash.id = uuid.v4();
        daily_cash.date = currentdate;
        daily_cash.type_id = data.id;
        daily_cash.cash_out = data.netamount;
        daily_cash.status = "purchase";
        daily_cash.type = "purchase";
        daily_cash.user_id = req.user.id;
        daily_cash.createddate = currentdate;
        daily_cash.updateddate = currentdate;
        query.push(RestApi.getDb("daily_cash").insert(daily_cash, "id"));

        daily_usage.id = uuid.v4();
        daily_usage.date = currentdate;
        daily_usage.daily_cash_type_id = "2260e052-6944-4984-a26f-35388fc0f6ed";
        daily_usage.title = "Purchase";
        daily_usage.total_amount = data.netamount;
        daily_usage.cash_amount = data.netamount;
        daily_usage.createddate = currentdate;
        daily_usage.updateddate = currentdate;
        query.push(RestApi.getDb("daily_usage").insert(daily_usage, "id"));

        payment.id = uuid.v4();
        payment.cash_id = daily_usage.id;
        payment.amount = data.netamount;
        payment.payment_type = "cash";
        payment.type = "usage";
        payment.createddate = currentdate;
        payment.updateddate = currentdate;
        query.push(RestApi.getDb("daily_cash_payment").insert(payment, "id"));
      }

      RestApi.getDb("purchase").where({id: data.id}).update(data, "id")
      .then((result) => {
        // if (data.paymenttype == "debt") {
        //   return Promise.all(query);
        // } else {
        //   return RestApi.getDb("daily_cash").insert(daily_cash, "id");
        // }
        return Promise.all(query);
      })
      .then((result) => {
        return RestApi.getDb("stock").select().first();
      })
      .then((stock_result) => {
        if (stock_result) {
          stock_result.gold_total_gm += parseFloat(data.gold_gm);
          stock_result.brass_total_gm += parseFloat(data.brass_gm);
          stock_result.silver_total_gm += parseFloat(data.silver_gm);
          stock_result.mo_total_gm += parseFloat(data.mo_gm);
          stock_result.updateddate = Utils.toSqlDate(new Date());
          return RestApi.getDb("stock").where("id", stock_result.id).update(stock_result, "id");
        } else {
          const stock_data = {
            id: uuid.v4(),
            gold_total_gm: parseFloat(data.gold_gm),
            brass_total_gm: parseFloat(data.brass_gm),
            silver_total_gm: parseFloat(data.silver_gm),
            mo_total_gm: parseFloat(data.mo_gm),
            createddate: Utils.toSqlDate(new Date()),
            updateddate: Utils.toSqlDate(new Date())
          };
          return RestApi.getDb("stock").insert(stock_data);
        }
      })
      .then((result) => {
        const prefix = "P";
        return RestApi.getDb("autogenerate")
        .select("*")
        .where("prefix", prefix);
      })
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
        const autogenId = result[0].id;
        delete (result[0].id);

        if (result[0].lastdate == datecode) {
          return RestApi.getDb("autogenerate").where("id", autogenId).update(result[0], "id") as PromiseLike<any>;
        } else {
          return RestApi.getDb("autogenerate").insert(autogenresult) as PromiseLike<any>;
        }
      })
      .then((result) => {
        res.json({ "success": result });
      })
      .catch((err) => {
        console.log(`${err}`);
        res.json({ "error": err });
      });
    } else {
      RestApi.getDb("purchase").where({id: data.id}).update(data, "id")
      .then((result) => {
        res.json({ "success": result });
      })
      .catch((err) => {
        console.log(`${err}`);
        res.json({ "error": err });
      });
    }
  }

  public postDelete(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = { id: req.params.id };
    if (Utils.isEmpty(data.id)) {
      return comfunc.sendForbidden(res);
    }

    RestApi.getDb("purchase").where({ id: data.id }).delete("id")
    .then((result) => {
      res.json({ "success": result });
    })
    .catch((err) => {
      console.log(`${err}`);
      res.json({ "error": err });
    });
  }

  public getDataList(req: express.Request, res: express.Response, next: express.NextFunction) {
    let params: any = { title: config.appname, user: req.user.username };
    params = Permission.getMenuParams(params, req, res);
    if (typeof (<any>req).jwtToken == "function") {
      (<any>req).jwtToken(jwtCredentialId)
        .then((result: string) => {
          params.token = result;
          res.render("dashboard/stock-data", params);
        })
        .catch((err: any) => {
          next(err);
        });

    } else {
      res.render("dashboard/stock-data", params);
    }
  }

  public getDataEdit(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = { id: req.params.id };
    if (Utils.isEmpty(data.id)) {
      return comfunc.sendForbidden(next);
    }
    const postUrl = `/stock-dataentry/edit/${data.id}`;
    let params: any = { title: config.appname, user: req.user.username, postUrl: postUrl, listUrl: "/stock-dataentry" };
    params = Permission.getMenuParams(params, req, res);
    let codes: any = [];

    const datecode = Utils.toGeneratecodeDate(new Date());
    RestApi.getDb("stock")
      .where("id", data.id)
      .select()
      .then((result) => {
        params.params = Utils.mixin(data, result[0]);

        if (typeof (<any>req).jwtToken == "function") {
          return (<any>req).jwtToken(jwtCredentialId);
        } else {
          return Promise.resolve("");
        }
      })
      .then((result) => {
        params.token = result;
        res.render("dashboard/stock-dataentry", params);
      })
      .catch((err) => {
        console.log(`${err}`);
        next({ "error": err });
      });
  }

  public postDataEdit(req: express.Request, res: express.Response, next: express.NextFunction) {
    const data = comfunc.fillDefaultFields(req.body);
    data.updateddate = Utils.toSqlDate(new Date());
 
    let db = RestApi.getDb("stock");
    if (Utils.isEmpty(data.id)) {
      return comfunc.sendForbidden(res);
    }

    db.where({ id: data.id })
      .update(data, "id")
      .then((result) => {
        res.json({ "success": result });
      })
      .catch((err) => {
        console.log(`${err}`);
        res.json({ "error": err });
      });
  }
}

export default new PurchaseRouter();