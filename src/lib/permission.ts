import express from "express";
import * as RestApi from "./restapi";

export class Permission {

  constructor() { }

  // 0: dashboard_Menu | 1: manage_user_Menu | 2: setup_Menu | 3: sale_Menu | 4: purchase_Menu | 5: other_Menu | 6: report_Menu
  public static onLoad(req: express.Request, res: express.Response, next: express.NextFunction): void {
    // console.log("permission load");
    const dashboard: any[] = [], manage_user: any[] = [], production: any[] = [], setup: any[] = [], dataentry: any[] = [], supplier: any[] = [], sale: any[] = [], purchase: any[] = [], cashinout: any[] = [], returnshowroom: any[] = [], returnproduction: any[] = [], report: any[] = [], exchange: any[] = [];
    const seperator: any = new RegExp(["\\\/", "\\\?"].join("|"), "g");
    const proCome: string = req.url.replace("/", "").split(seperator)[0];
    console.log(proCome);
    let proGive: any;
    if (req.isAuthenticated()) {
      if (req.user.id == 0) {
        console.log("user -1 ");
        (async () => {
          await RestApi.getDb("program").where("access", 1).select()
            .then((result) => {
              for (const i in result) {
                result[i].read = 1;
                result[i].write = 1;
                result[i].delete = 1;
                switch (result[i].menu_no) {
                  case 0: dashboard.push(result[i]); break;
                  case 1: manage_user.push(result[i]); break;
                  case 2: setup.push(result[i]); break;
                  case 3: dataentry.push(result[i]); break;
                  case 4: supplier.push(result[i]); break;
                  case 5: purchase.push(result[i]); break;
                  case 6: production.push(result[i]); break;
                  case 7: sale.push(result[i]); break;
                  case 8: cashinout.push(result[i]); break;
                  case 9: returnshowroom.push(result[i]); break;
                  case 10: returnproduction.push(result[i]); break;
                  case 11: report.push(result[i]); break;
                  case 12: exchange.push(result[i]); break;
                  default: break;
                }
              }
              proGive = result.find((pp: any) => {
                return pp.program == proCome;
              });
            })
            .catch((err) => {
              console.log(`${err}`);
            });
          // console.log("-1 == ProGive : ", proGive);
          res.locals.permission = {
            dashboard: dashboard,
            manage: manage_user,
            setup: setup,
            dataentry: dataentry,
            supplier: supplier,
            purchase: purchase,
            production: production,
            sale: sale,
            cashinout: cashinout,
            returnshowroom: returnshowroom,
            returnproduction: returnproduction,
            report: report,
            exchange: exchange,
            access: proGive.read + "," + proGive.write + "," + proGive.delete
          };
          await next();
        })();
      } else {
        (async () => {
          await RestApi.getDb("user").columns("roleid").where({ id: req.user.id }).select()
            .then((result) => {
              return RestApi.getDb().columns("program.*", "user_role_item.read", "user_role_item.write", "user_role_item.delete")
                .select()
                .from("program")
                .leftJoin("user_role_item", "user_role_item.programid", "program.id")
                .where({ "user_role_item.roleid": result[0].roleid, "access": 1 });
            })
            .then((result) => {
              console.log("result ", result);
              for (const i in result) {
                if (!(result[i].read == 0 && result[i].write == 0 && result[i].delete == 0)) {
                  switch (result[i].menu_no) {
                    case 0: dashboard.push(result[i]); break;
                    case 1: manage_user.push(result[i]); break;
                    case 2: setup.push(result[i]); break;
                    case 3: dataentry.push(result[i]); break;
                    case 4: supplier.push(result[i]); break;
                    case 5: purchase.push(result[i]); break;
                    case 6: production.push(result[i]); break;
                    case 7: sale.push(result[i]); break;
                    case 8: cashinout.push(result[i]); break;
                    case 9: returnproduction.push(result[i]); break;
                    case 10: returnshowroom.push(result[i]); break;
                    case 11: report.push(result[i]); break;
                    case 12: exchange.push(result[i]); break;
                    default: break;
                  }
                  proGive = result.find((pp: any) => {
                    return pp.program == proCome;
                  });
                }
              }
              // console.log("general ", general);
              // console.log(req.user.id + "ProGive : ", proGive);
            })
            .catch((err) => {
              console.log(`${err}`);
            });
          res.locals.permission = {
            dashboard: dashboard,
            manage: manage_user,
            setup: setup,
            dataentry: dataentry,
            supplier: supplier,
            purchase: purchase,
            production: production,
            sale: sale,
            cashinout: cashinout,
            returnshowroom: returnshowroom,
            returnproduction: returnproduction,
            report: report,
            exchange: exchange,
            access: proGive.read + "," + proGive.write + "," + proGive.delete
          };
          await next();
        })();
      }
      console.log("permissions ", res.locals.permission);
    } else {
      res.redirect(`/login?url=${req.url}`);
    }
  }

  public checkPermission(user: any): boolean {
    // comming soon
    return true;
  }

  public static getMenuParams(params: any, req: express.Request, res: express.Response): any {
    // console.log("PERMISSIONS");
    params.login = req.isAuthenticated();
    params.permission = res.locals.permission;
    // console.log("permission ", params.permission);
    // if (typeof (<any>req).jwtToken == "function") {
    //   params.csrfToken = (<any>req).csrfToken();
    // }
    return params;
  }
}