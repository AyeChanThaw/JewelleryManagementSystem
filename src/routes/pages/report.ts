/**
 * Report Routes
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

class ReportRouter extends ExpressRouter {
  constructor() {
    super();

    this.route("/stock-report").all(Permission.onLoad).get(this.getStockReport);
    this.route("/purchase-pt-report").all(Permission.onLoad).get(this.getPurchasePTReport);
    this.route("/wholediamond-report").all(Permission.onLoad).get(this.getWholediamondReport);
    this.route("/get-goldsmith-report").all(Permission.onLoad).get(this.getGetGoldsmithReport);
    this.route("/item-report").all(Permission.onLoad).get(this.getItemReport);
    this.route("/daily-cash-report").all(Permission.onLoad).get(this.getDailyCashReport);
    this.route("/daily-cash-showroom-report").all(Permission.onLoad).get(this.getDailyCashShowroomReport);
    this.route("/sale-diamond-report").all(Permission.onLoad).get(this.getSaleDiamondReport);
    this.route("/sale-gold-report").all(Permission.onLoad).get(this.getSaleGoldReport);
    this.route("/supplier-debt-report").all(Permission.onLoad).get(this.getSupplierDebtReport);
    this.route("/customer-debt-report").all(Permission.onLoad).get(this.getCustomerDebtReport);
    this.route("/diamond-report").all(Permission.onLoad).get(this.getDiamondReport);
    this.route("/goldsmith-report").all(Permission.onLoad).get(this.getGoldsmithReport);
    this.route("/first-polish-report").all(Permission.onLoad).get(this.getFirstPolishReport);
    this.route("/daily-stock-report").all(Permission.onLoad).get(this.getDailyStockReport);
    this.route("/return-item-report").all(Permission.onLoad).get(this.getReturnItemReport);
    this.route("/change-diamond-report").all(Permission.onLoad).get(this.getChangeDiamondReport);
    this.route("/sale-person-report").all(Permission.onLoad).get(this.getSalePersonReport);
    this.route("/order-mould-report").all(Permission.onLoad).get(this.getOrderMouldReport);
    this.route("/sale-report").all(Permission.onLoad).get(this.getSaleReport);
    this.route("/sale-customer-report").all(Permission.onLoad).get(this.getSaleCustomerReport);
    this.route("/item-detail-report").all(Permission.onLoad).get(this.getItemDetailReport);
    this.route("/outside-goldsmith-report").all(Permission.onLoad).get(this.getOutsideGoldsmithReport);
    this.route("/showroom-stock-report").all(Permission.onLoad).get(this.getShowroomStockReport);
    this.route("/debt-pay-report").all(Permission.onLoad).get(this.getDebtPayReport);
    this.route("/debt-get-report").all(Permission.onLoad).get(this.getDebtGetReport);
    this.route("/cash-inout-production-report").all(Permission.onLoad).get(this.getCashInOutProductionReport);
    this.route("/cash-inout-showroom-report").all(Permission.onLoad).get(this.getCashInOutShowroomReport);
  }

  public onLoad(req: express.Request, res: express.Response, next: express.NextFunction) {
    if (req.isAuthenticated()) {
      next();
    } else {
      res.redirect(`/login?url=${req.url}`);
    }
  }

  public getStockReport(req: express.Request, res: express.Response, next: express.NextFunction) {
    let params: any = { title: config.appname, user: req.user.username };
    params = Permission.getMenuParams(params, req, res);
    if (typeof (<any>req).jwtToken == "function") {
      (<any>req).jwtToken(jwtCredentialId)
        .then((result: string) => {
          params.token = result;
          res.render("dashboard/stock-report", params);
        })
        .catch((err: any) => {
          next(err);
        });

    } else {
      res.render("dashboard/stock-report", params);
    }
  }

  public getPurchasePTReport(req: express.Request, res: express.Response, next: express.NextFunction) {
    let params: any = { title: config.appname, user: req.user.username };
    params = Permission.getMenuParams(params, req, res);
    if (typeof (<any>req).jwtToken == "function") {
      (<any>req).jwtToken(jwtCredentialId)
        .then((result: string) => {
          params.token = result;
          res.render("dashboard/purchase-pt-report", params);
        })
        .catch((err: any) => {
          next(err);
        });

    } else {
      res.render("dashboard/purchase-pt-report", params);
    }
  }

  public getWholediamondReport(req: express.Request, res: express.Response, next: express.NextFunction) {
    let params: any = { title: config.appname, user: req.user.username };
    params = Permission.getMenuParams(params, req, res);
    if (typeof (<any>req).jwtToken == "function") {
      (<any>req).jwtToken(jwtCredentialId)
        .then((result: string) => {
          params.token = result;
          res.render("dashboard/wholediamond-report", params);
        })
        .catch((err: any) => {
          next(err);
        });

    } else {
      res.render("dashboard/wholediamond-report", params);
    }
  }

  public getGetGoldsmithReport(req: express.Request, res: express.Response, next: express.NextFunction) {
    let params: any = { title: config.appname, user: req.user.username };
    params = Permission.getMenuParams(params, req, res);
    if (typeof (<any>req).jwtToken == "function") {
      (<any>req).jwtToken(jwtCredentialId)
        .then((result: string) => {
          params.token = result;
          res.render("dashboard/get-goldsmith-report", params);
        })
        .catch((err: any) => {
          next(err);
        });

    } else {
      res.render("dashboard/get-goldsmith-report", params);
    }
  }

  public getItemReport(req: express.Request, res: express.Response, next: express.NextFunction) {
    let params: any = { title: config.appname, user: req.user.username };
    params = Permission.getMenuParams(params, req, res);
    if (typeof (<any>req).jwtToken == "function") {
      (<any>req).jwtToken(jwtCredentialId)
        .then((result: string) => {
          params.token = result;
          res.render("dashboard/item-report", params);
        })
        .catch((err: any) => {
          next(err);
        });

    } else {
      res.render("dashboard/item-report", params);
    }
  }

  public getDailyCashReport(req: express.Request, res: express.Response, next: express.NextFunction) {
    let params: any = { title: config.appname, user: req.user.username };
    params = Permission.getMenuParams(params, req, res);
    if (typeof (<any>req).jwtToken == "function") {
      (<any>req).jwtToken(jwtCredentialId)
        .then((result: string) => {
          params.token = result;
          res.render("dashboard/daily-cash-report", params);
        })
        .catch((err: any) => {
          next(err);
        });

    } else {
      res.render("dashboard/daily-cash-report", params);
    }
  }

  public getDailyCashShowroomReport(req: express.Request, res: express.Response, next: express.NextFunction) {
    let params: any = { title: config.appname, user: req.user.username };
    params = Permission.getMenuParams(params, req, res);
    if (typeof (<any>req).jwtToken == "function") {
      (<any>req).jwtToken(jwtCredentialId)
        .then((result: string) => {
          params.token = result;
          res.render("dashboard/daily-cash-showroom-report", params);
        })
        .catch((err: any) => {
          next(err);
        });

    } else {
      res.render("dashboard/daily-cash-showroom-report", params);
    }
  }

  public getSaleDiamondReport(req: express.Request, res: express.Response, next: express.NextFunction) {
    let params: any = { title: config.appname, user: req.user.username };
    params = Permission.getMenuParams(params, req, res);
    if (typeof (<any>req).jwtToken == "function") {
      (<any>req).jwtToken(jwtCredentialId)
        .then((result: string) => {
          params.token = result;
          res.render("dashboard/sale-diamond-report", params);
        })
        .catch((err: any) => {
          next(err);
        });

    } else {
      res.render("dashboard/sale-diamond-report", params);
    }
  }

  public getSaleGoldReport(req: express.Request, res: express.Response, next: express.NextFunction) {
    let params: any = { title: config.appname, user: req.user.username };
    params = Permission.getMenuParams(params, req, res);
    if (typeof (<any>req).jwtToken == "function") {
      (<any>req).jwtToken(jwtCredentialId)
        .then((result: string) => {
          params.token = result;
          res.render("dashboard/sale-gold-report", params);
        })
        .catch((err: any) => {
          next(err);
        });

    } else {
      res.render("dashboard/sale-gold-report", params);
    }
  }

  public getSupplierDebtReport(req: express.Request, res: express.Response, next: express.NextFunction) {
    let params: any = { title: config.appname, user: req.user.username };
    params = Permission.getMenuParams(params, req, res);
    if (typeof (<any>req).jwtToken == "function") {
      (<any>req).jwtToken(jwtCredentialId)
        .then((result: string) => {
          params.token = result;
          res.render("dashboard/supplier-debt-report", params);
        })
        .catch((err: any) => {
          next(err);
        });

    } else {
      res.render("dashboard/supplier-debt-report", params);
    }
  }

  public getCustomerDebtReport(req: express.Request, res: express.Response, next: express.NextFunction) {
    let params: any = { title: config.appname, user: req.user.username };
    params = Permission.getMenuParams(params, req, res);
    if (typeof (<any>req).jwtToken == "function") {
      (<any>req).jwtToken(jwtCredentialId)
        .then((result: string) => {
          params.token = result;
          res.render("dashboard/customer-debt-report", params);
        })
        .catch((err: any) => {
          next(err);
        });

    } else {
      res.render("dashboard/customer-debt-report", params);
    }
  }

  public getDiamondReport(req: express.Request, res: express.Response, next: express.NextFunction) {
    let params: any = { title: config.appname, user: req.user.username };
    params = Permission.getMenuParams(params, req, res);
    if (typeof (<any>req).jwtToken == "function") {
      (<any>req).jwtToken(jwtCredentialId)
        .then((result: string) => {
          params.token = result;
          res.render("dashboard/diamond-report", params);
        })
        .catch((err: any) => {
          next(err);
        });

    } else {
      res.render("dashboard/diamond-report", params);
    }
  }

  public getGoldsmithReport(req: express.Request, res: express.Response, next: express.NextFunction) {
    let params: any = { title: config.appname, user: req.user.username };
    params = Permission.getMenuParams(params, req, res);
    if (typeof (<any>req).jwtToken == "function") {
      (<any>req).jwtToken(jwtCredentialId)
        .then((result: string) => {
          params.token = result;
          res.render("dashboard/goldsmith-report", params);
        })
        .catch((err: any) => {
          next(err);
        });

    } else {
      res.render("dashboard/goldsmith-report", params);
    }
  }

  public getFirstPolishReport(req: express.Request, res: express.Response, next: express.NextFunction) {
    let params: any = { title: config.appname, user: req.user.username };
    params = Permission.getMenuParams(params, req, res);
    if (typeof (<any>req).jwtToken == "function") {
      (<any>req).jwtToken(jwtCredentialId)
        .then((result: string) => {
          params.token = result;
          res.render("dashboard/first-polish-report", params);
        })
        .catch((err: any) => {
          next(err);
        });

    } else {
      res.render("dashboard/first-polish-report", params);
    }
  }

  public getDailyStockReport(req: express.Request, res: express.Response, next: express.NextFunction) {
    let params: any = { title: config.appname, user: req.user.username };
    params = Permission.getMenuParams(params, req, res);
    if (typeof (<any>req).jwtToken == "function") {
      (<any>req).jwtToken(jwtCredentialId)
        .then((result: string) => {
          params.token = result;
          res.render("dashboard/daily-stock-report", params);
        })
        .catch((err: any) => {
          next(err);
        });

    } else {
      res.render("dashboard/daily-stock-report", params);
    }
  }

  public getReturnItemReport(req: express.Request, res: express.Response, next: express.NextFunction) {
    let params: any = { title: config.appname, user: req.user.username };
    params = Permission.getMenuParams(params, req, res);
    if (typeof (<any>req).jwtToken == "function") {
      (<any>req).jwtToken(jwtCredentialId)
        .then((result: string) => {
          params.token = result;
          res.render("dashboard/return-item-report", params);
        })
        .catch((err: any) => {
          next(err);
        });

    } else {
      res.render("dashboard/return-item-report", params);
    }
  }

  public getChangeDiamondReport(req: express.Request, res: express.Response, next: express.NextFunction) {
    let params: any = { title: config.appname, user: req.user.username };
    params = Permission.getMenuParams(params, req, res);
    if (typeof (<any>req).jwtToken == "function") {
      (<any>req).jwtToken(jwtCredentialId)
        .then((result: string) => {
          params.token = result;
          res.render("dashboard/change-diamond-report", params);
        })
        .catch((err: any) => {
          next(err);
        });

    } else {
      res.render("dashboard/change-diamond-report", params);
    }
  }

  public getSalePersonReport(req: express.Request, res: express.Response, next: express.NextFunction) {
    let params: any = { title: config.appname, user: req.user.username };
    params = Permission.getMenuParams(params, req, res);
    if (typeof (<any>req).jwtToken == "function") {
      (<any>req).jwtToken(jwtCredentialId)
        .then((result: string) => {
          params.token = result;
          res.render("dashboard/sale-person-report", params);
        })
        .catch((err: any) => {
          next(err);
        });

    } else {
      res.render("dashboard/sale-person-report", params);
    }
  }

  public getOrderMouldReport(req: express.Request, res: express.Response, next: express.NextFunction) {
    let params: any = { title: config.appname, user: req.user.username };
    params = Permission.getMenuParams(params, req, res);
    if (typeof (<any>req).jwtToken == "function") {
      (<any>req).jwtToken(jwtCredentialId)
        .then((result: string) => {
          params.token = result;
          res.render("dashboard/order-mould-report", params);
        })
        .catch((err: any) => {
          next(err);
        });

    } else {
      res.render("dashboard/order-mould-report", params);
    }
  }

  public getSaleReport(req: express.Request, res: express.Response, next: express.NextFunction) {
    let params: any = { title: config.appname, user: req.user.username };
    params = Permission.getMenuParams(params, req, res);
    if (typeof (<any>req).jwtToken == "function") {
      (<any>req).jwtToken(jwtCredentialId)
        .then((result: string) => {
          params.token = result;
          res.render("dashboard/sale-report", params);
        })
        .catch((err: any) => {
          next(err);
        });

    } else {
      res.render("dashboard/sale-report", params);
    }
  }

  public getSaleCustomerReport(req: express.Request, res: express.Response, next: express.NextFunction) {
    let params: any = { title: config.appname, user: req.user.username };
    params = Permission.getMenuParams(params, req, res);
    if (typeof (<any>req).jwtToken == "function") {
      (<any>req).jwtToken(jwtCredentialId)
        .then((result: string) => {
          params.token = result;
          res.render("dashboard/sale-customer-report", params);
        })
        .catch((err: any) => {
          next(err);
        });

    } else {
      res.render("dashboard/sale-customer-report", params);
    }
  }

  public getItemDetailReport(req: express.Request, res: express.Response, next: express.NextFunction) {
    let params: any = { title: config.appname, user: req.user.username };
    params = Permission.getMenuParams(params, req, res);
    if (typeof (<any>req).jwtToken == "function") {
      (<any>req).jwtToken(jwtCredentialId)
        .then((result: string) => {
          params.token = result;
          res.render("dashboard/item-detail-report", params);
        })
        .catch((err: any) => {
          next(err);
        });

    } else {
      res.render("dashboard/item-detail-report", params);
    }
  }

  public getOutsideGoldsmithReport(req: express.Request, res: express.Response, next: express.NextFunction) {
    let params: any = { title: config.appname, user: req.user.username };
    params = Permission.getMenuParams(params, req, res);
    if (typeof (<any>req).jwtToken == "function") {
      (<any>req).jwtToken(jwtCredentialId)
        .then((result: string) => {
          params.token = result;
          res.render("dashboard/outside-goldsmith-report", params);
        })
        .catch((err: any) => {
          next(err);
        });

    } else {
      res.render("dashboard/outside-goldsmith-report", params);
    }
  }

  public getShowroomStockReport(req: express.Request, res: express.Response, next: express.NextFunction) {
    let params: any = { title: config.appname, user: req.user.username };
    params = Permission.getMenuParams(params, req, res);
    if (typeof (<any>req).jwtToken == "function") {
      (<any>req).jwtToken(jwtCredentialId)
        .then((result: string) => {
          params.token = result;
          res.render("dashboard/showroom-stock-report", params);
        })
        .catch((err: any) => {
          next(err);
        });

    } else {
      res.render("dashboard/showroom-stock-report", params);
    }
  }

  public getDebtPayReport(req: express.Request, res: express.Response, next: express.NextFunction) {
    let params: any = { title: config.appname, user: req.user.username };
    params = Permission.getMenuParams(params, req, res);
    if (typeof (<any>req).jwtToken == "function") {
      (<any>req).jwtToken(jwtCredentialId)
        .then((result: string) => {
          params.token = result;
          res.render("dashboard/debt-pay-report", params);
        })
        .catch((err: any) => {
          next(err);
        });

    } else {
      res.render("dashboard/debt-pay-report", params);
    }
  }

  public getDebtGetReport(req: express.Request, res: express.Response, next: express.NextFunction) {
    let params: any = { title: config.appname, user: req.user.username };
    params = Permission.getMenuParams(params, req, res);
    if (typeof (<any>req).jwtToken == "function") {
      (<any>req).jwtToken(jwtCredentialId)
        .then((result: string) => {
          params.token = result;
          res.render("dashboard/debt-get-report", params);
        })
        .catch((err: any) => {
          next(err);
        });

    } else {
      res.render("dashboard/debt-get-report", params);
    }
  }

  public getCashInOutProductionReport(req: express.Request, res: express.Response, next: express.NextFunction) {
    let params: any = { title: config.appname, user: req.user.username };
    params = Permission.getMenuParams(params, req, res);
    if (typeof (<any>req).jwtToken == "function") {
      (<any>req).jwtToken(jwtCredentialId)
        .then((result: string) => {
          params.token = result;
          res.render("dashboard/cash-inout-production-report", params);
        })
        .catch((err: any) => {
          next(err);
        });

    } else {
      res.render("dashboard/cash-inout-production-report", params);
    }
  }

  public getCashInOutShowroomReport(req: express.Request, res: express.Response, next: express.NextFunction) {
    let params: any = { title: config.appname, user: req.user.username };
    params = Permission.getMenuParams(params, req, res);
    if (typeof (<any>req).jwtToken == "function") {
      (<any>req).jwtToken(jwtCredentialId)
        .then((result: string) => {
          params.token = result;
          res.render("dashboard/cash-inout-showroom-report", params);
        })
        .catch((err: any) => {
          next(err);
        });

    } else {
      res.render("dashboard/cash-inout-showroom-report", params);
    }
  }
}

export default new ReportRouter();