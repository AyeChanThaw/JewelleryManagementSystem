/**
 * Calculation Service Routes
 */
import * as express from "express";
import { ExpressRouter } from "../../lib/express-application";
import { Utils } from "../../lib/utils";
import config from "../../../data/config.json";
import * as RestApi from "../../lib/restapi";
import * as comfunc from "../../lib/comfunc";
import * as uuid from "uuid";

const jwtCredentialId = config.jwt.defCredentialId;

class CalculationServiceRouter extends ExpressRouter {
  constructor() {
    super();

    this.route(`/${config.service_apiroute}/checkValue`).get(this.checkValue).post(this.postMethodDenied);
    this.route(`/${config.service_apiroute}/ChangeGmToKPY`).get(this.ChangeGmToKPY).post(this.postMethodDenied);
    this.route(`/${config.service_apiroute}/ChangeKPYToGm`).get(this.ChangeKPYToGm).post(this.postMethodDenied);
    this.route(`/${config.service_apiroute}/ChangeKPYToKyat`).get(this.ChangeKPYToKyat).post(this.postMethodDenied);
    this.route(`/${config.service_apiroute}/checkKPY`).get(this.checkKPY).post(this.postMethodDenied);
    this.route(`/${config.service_apiroute}/calc_wgtpluslosskpy_minusgemkpy`).get(this.calc_wgtpluslosskpy_minusgemkpy).post(this.postMethodDenied);
    this.route(`/${config.service_apiroute}/calc_tot_amount`).get(this.calc_tot_amount).post(this.postMethodDenied);
    this.route(`/${config.service_apiroute}/calc_gold_amount`).get(this.calc_gold_amount).post(this.postMethodDenied);
    this.route(`/${config.service_apiroute}/calc_amount_from_kpy`).get(this.calc_amount_from_kpy).post(this.postMethodDenied);
  }

  public postMethodDenied(req: express.Request, res: express.Response, next: express.NextFunction) {
    res.send({ "message": "403 Forbidden!", "data": "Access to this resource on the server is denied!" });
  }

  public checkValue(req: express.Request, res: express.Response, next: express.NextFunction) {
    const params: any = { title: config.appname };
    params.login = req.isAuthenticated();
    if (typeof (<any>req).jwtToken == "function") {
      (<any>req).jwtToken(jwtCredentialId)
        .then((result: string) => {
          params.token = result;
          const statusCheck = Utils.checkValue(req.param("value"));
          res.json({ "message": "success", "data": statusCheck });

        })
        .catch((err: any) => {
          next(err);
        });

    } else {
        res.json({ "message": "failed", "data": "Permission Denied!" });
    }
  }

  public ChangeGmToKPY(req: express.Request, res: express.Response, next: express.NextFunction) {
    const params: any = { title: config.appname };
    params.login = req.isAuthenticated();
    if (typeof (<any>req).jwtToken == "function") {
      (<any>req).jwtToken(jwtCredentialId)
        .then((result: string) => {
          params.token = result;
          const statusCheck = Utils.ChangeGmToKPY(req.param("Gm"));
          res.json({ "message": "success", "data": statusCheck });

        })
        .catch((err: any) => {
          next(err);
        });

    } else {
        res.json({ "message": "failed", "data": "Permission Denied!" });
    }
  }

  public ChangeKPYToGm(req: express.Request, res: express.Response, next: express.NextFunction) {
    const params: any = { title: config.appname };
    params.login = req.isAuthenticated();
    if (typeof (<any>req).jwtToken == "function") {
      (<any>req).jwtToken(jwtCredentialId)
        .then((result: string) => {
          params.token = result;
          const statusCheck = Utils.ChangeKPYToGm(req.param("Kyat"), req.param("Pae"), req.param("Yway"));
          res.json({ "message": "success", "data": statusCheck });

        })
        .catch((err: any) => {
          next(err);
        });

    } else {
        res.json({ "message": "failed", "data": "Permission Denied!" });
    }
  }

  public ChangeKPYToKyat(req: express.Request, res: express.Response, next: express.NextFunction) {
    const params: any = { title: config.appname };
    params.login = req.isAuthenticated();
    if (typeof (<any>req).jwtToken == "function") {
      (<any>req).jwtToken(jwtCredentialId)
        .then((result: string) => {
          params.token = result;
          const statusCheck = Utils.ChangeKPYToKyat(req.param("Kyat"), req.param("Pae"), req.param("Yway"));
          res.json({ "message": "success", "data": statusCheck });

        })
        .catch((err: any) => {
          next(err);
        });

    } else {
        res.json({ "message": "failed", "data": "Permission Denied!" });
    }
  }

  public checkKPY(req: express.Request, res: express.Response, next: express.NextFunction) {
    const params: any = { title: config.appname };
    params.login = req.isAuthenticated();
    if (typeof (<any>req).jwtToken == "function") {
      (<any>req).jwtToken(jwtCredentialId)
        .then((result: string) => {
          params.token = result;
          const statusCheck = Utils.CheckKPY(req.param("K"), req.param("P"), req.param("Y"));
          res.json({ "message": "success", "data": statusCheck });

        })
        .catch((err: any) => {
          next(err);
        });

    } else {
        res.json({ "message": "failed", "data": "Permission Denied!" });
    }
  }

  public calc_gold_amount(req: express.Request, res: express.Response, next: express.NextFunction) {
    const params: any = { title: config.appname };
    params.login = req.isAuthenticated();
    if (typeof (<any>req).jwtToken == "function") {
      (<any>req).jwtToken(jwtCredentialId)
        .then((result: string) => {
          params.token = result;
          const statusCheck = Utils.calc_gold_amount(req.param("wgt_gm"), req.param("current_rate"));
          res.json({ "message": "success", "data": statusCheck });
        })
        .catch((err: any) => {
          next(err);
        });

    } else {
        res.json({ "message": "failed", "data": "Permission Denied!" });
    }
  }

  public calc_amount_from_kpy(req: express.Request, res: express.Response, next: express.NextFunction) {
    const params: any = { title: config.appname };
    params.login = req.isAuthenticated();
    if (typeof (<any>req).jwtToken == "function") {
      (<any>req).jwtToken(jwtCredentialId)
        .then((result: string) => {
          params.token = result;
          const statusCheck = Utils.calc_amount_from_kpy(req.param("wgt_k"), req.param("wgt_p"), req.param("wgt_y"), req.param("current_rate"));
          res.json({ "message": "success", "data": statusCheck });
        })
        .catch((err: any) => {
          next(err);
        });

    } else {
        res.json({ "message": "failed", "data": "Permission Denied!" });
    }
  }

  public calc_wgtpluslosskpy_minusgemkpy(req: express.Request, res: express.Response, next: express.NextFunction) {
    const params: any = { title: config.appname };
    params.login = req.isAuthenticated();
    if (typeof (<any>req).jwtToken == "function") {
      (<any>req).jwtToken(jwtCredentialId)
        .then((result: string) => {
          params.token = result;
          const statusCheck = Utils.calc_wgtpluslosskpy_minusgemkpy(req.param("wgtplusloss_k"), req.param("wgtplusloss_p"), req.param("wgtplusloss_y"), req.param("gemwgt_k"), req.param("gemwgt_p"), req.param("gemwgt_y"));
          res.json({ "message": "success", "data": statusCheck });

        })
        .catch((err: any) => {
          next(err);
        });

    } else {
        res.json({ "message": "failed", "data": "Permission Denied!" });
    }
  }

  public calc_tot_amount(req: express.Request, res: express.Response, next: express.NextFunction) {
    const params: any = { title: config.appname };
    params.login = req.isAuthenticated();
    if (typeof (<any>req).jwtToken == "function") {
      (<any>req).jwtToken(jwtCredentialId)
        .then((result: string) => {
          params.token = result;
          const statusCheck = Utils.calc_tot_amount(req.param("_netwgt_gm"), req.param("_goldrate_amount"), req.param("_gemprice"), req.param("_service_charge"));
          res.json({ "message": "success", "data": statusCheck });

        })
        .catch((err: any) => {
          next(err);
        });

    } else {
        res.json({ "message": "failed", "data": "Permission Denied!" });
    }
  }
}


export default new CalculationServiceRouter();