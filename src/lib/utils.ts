/**
 * Utils
 */
import * as crypto from "crypto";
import * as fs from "fs";
import * as pathModule from "path";
import * as DateFormat from "./date-and-time";
import * as RestApi from "./restapi";
import { stringLiteral } from "babel-types";

export class PathfinderError extends Error {
  public findPath: string;

  constructor(findPath: string, message?: string | undefined) {
      super(message);
      this.findPath = findPath;
  }
}

export class Utils {
  private static date = DateFormat.default;

  constructor() {}

  public static mixin(dest: any, src: any, redefine: boolean = true) {
    if (!dest) {
      throw new TypeError("argument dest is required");
    }
    if (!src) {
      throw new TypeError("argument src is required");
    }
    const hasOwnProperty = Object.prototype.hasOwnProperty;
    Object.getOwnPropertyNames(src).forEach((name) => {
      if (!redefine && hasOwnProperty.call(dest, name)) {
        return;
      }
      const descriptor = Object.getOwnPropertyDescriptor(src, name);
      Object.defineProperty(dest, name, descriptor);
    });
    return dest;
  }

  public static encodeUrl(url: string): string {
    return url.replace(/%/g, "%25")
        .replace(/\n/g, "%0A")
        .replace(/\r/g, "%0D")
        .replace(/\s/g, "%20")
        .replace(/[!#$&'\(\)\*\+,/:;=\?@\[\]\"\-.<>\\^_`\{|\}~]/g, function(x) {
          return `%${x.charCodeAt(0).toString(16)}`;
        });
  }

  public static decodeUrl(url: string): string {
    url = `${url}`;
    try {
      url = decodeURIComponent(url);
    } catch (err) { }
    url = url.replace(/%([0-9A-F]{2})/g, (x, x1) => {
      return String.fromCharCode(parseInt(x1, 16));
    });
    return url;
  }

  public static isEmpty(obj: any): boolean {
    if (typeof obj === "undefined") return true;
    if (!obj) return true;
    if (typeof obj === "number" && isNaN(obj)) return true;
    if (typeof obj === "string" && obj == "") return true;
    if (typeof obj === "object") {
      if (Array.isArray(obj) && obj.length == 0) {
        return true;
      } else {
        const temp = JSON.stringify(obj).replace(/[\{\}\[\]\s]/g, "");
        return (temp === "");
      }
    }
    return false;
  }

  public static tryGet(obj: any, key: string, defVal: any = {}) {
    if (!obj || typeof obj !== "object") return defVal;
    if (!key || typeof key === "undefined") return defVal;
    if (typeof key === "string" && key === "") return defVal;
    if (typeof obj[key] !== "undefined") {
      return obj[key];
    }
    return defVal;
  }

  public static tryParseInt(val: any, def: number = 0): number {
    let v = `${val}`;
    const regex = new RegExp("[^0-9]", "g");
    v = v.replace(regex, "");
    try {
      return parseInt(v);
    } catch {
    }
    return def;
  }

  public static tryParseBoolean(val: any): boolean {
    const v = `${val}`;
    const match = /^(true|false|[\d]+)$/i.exec(v);
    if (!match) {
      const temp = JSON.stringify(val).replace(/[\{\}\[\]\s\"\']/g, "");
      return (temp.length > 0);
    } else if (/[0-9]+/.test(`${match[1]}`)) {
      const v1 = `${match[1]}`;
      try {
        return (parseInt(v1) > 0);
      } catch {
      }
      return false;
    } else {
      return (match[1].toLowerCase() != "false");
    }
  }

  public static get_autogenerate_prefix(val: any): string {
    if (!val) return "";
      RestApi.getDb("autogenerate")
      .select("prefix")
      .where("tablename", val)
      .then((result) => {
        return result;
      })
      .catch((err) => {
        console.log("err ", err);
        return err;
      });
  }

  public static toSqlDate(dateVal?: any, fromFormat: string = "DD/MM/YYYY") {
    if (!dateVal) return "";
    let dateObj: Date = new Date();
    if (typeof dateVal === "string") {
      dateVal = dateVal.replace(/^(\d{2,4}-\d{1,2}-\d{1,2})T(\d{1,2}:\d{1,2}:\d{1,2}.\d{1,3})(.*)$/, "$1");
      dateObj = Utils.date.parse(dateVal, fromFormat);
    } else if (typeof dateVal === "object" && typeof dateVal.getTime == "function") {
      dateObj = new Date(dateVal.getTime());
    }
    if (typeof dateObj.getTime !== "function") return "";
    return Utils.date.format(dateObj, "YYYY-MM-DD");
  }

  public static toSqlDateWithM(dateVal?: any, fromFormat: string = "DD/MMM/YYYY") {
    if (!dateVal) return "";
    let dateObj: Date = new Date();
    if (typeof dateVal === "string") {
      dateVal = dateVal.replace(/^(\d{2,4}-\d{1,2}-\d{1,2})T(\d{1,2}:\d{1,2}:\d{1,2}.\d{1,3})(.*)$/, "$1");
      dateObj = Utils.date.parse(dateVal, fromFormat);
    } else if (typeof dateVal === "object" && typeof dateVal.getTime == "function") {
      dateObj = new Date(dateVal.getTime());
    }
    if (typeof dateObj.getTime !== "function") return "";
    return Utils.date.format(dateObj, "YYYY-MM-DD");
  }

  public static toSqlDateTime(dateVal?: any, fromFormat: string = "DD/MM/YYYY") {
    if (!dateVal) return "";
    let dateObj: Date = new Date();
    if (typeof dateVal === "string") {
      dateVal = dateVal.replace(/^(\d{2,4}-\d{1,2}-\d{1,2})T(\d{1,2}:\d{1,2}:\d{1,2}.\d{1,3})(.*)$/, "$1");
      dateObj = Utils.date.parse(dateVal, fromFormat);
    } else if (typeof dateVal === "object" && typeof dateVal.getTime == "function") {
      dateObj = new Date(dateVal.getTime());
    }
    if (typeof dateObj.getTime !== "function") return "";
    return Utils.date.format(dateObj, "YYYY-MM-DD HH:MM");
  }

  public static toDisplayDate(dateVal?: any, fromFormat: string = "YYYY-MM-DD") {
    if (!dateVal) return "";
    let dateObj = new Date();
    if (typeof dateVal === "string") {
      dateVal = dateVal.replace(/^(\d{2,4}-\d{1,2}-\d{1,2})T(\d{1,2}:\d{1,2}:\d{1,2}.\d{1,3})(.*)$/, "$1");
      dateObj = Utils.date.parse(dateVal, fromFormat);
    } else if (typeof dateVal === "object" && typeof dateVal.getTime == "function") {
      dateObj = new Date(dateVal.getTime());
    }
    if (typeof dateObj.getTime !== "function") return "";
    return Utils.date.format(dateObj, "DD/MM/YYYY");
  }

  public static toSaveSqlDate(dateVal?: any, fromFormat: string = "DD/MMM/YYYY") {
    if (!dateVal) return "";
    let dateObj: Date = new Date();
    if (typeof dateVal === "string") {
      dateVal = dateVal.replace(/^(\d{2,4}-\d{1,2}-\d{1,2})T(\d{1,2}:\d{1,2}:\d{1,2}.\d{1,3})(.*)$/, "$1");
      dateObj = Utils.date.parse(dateVal, fromFormat);
    } else if (typeof dateVal === "object" && typeof dateVal.getTime == "function") {
      dateObj = new Date(dateVal.getTime());
    }
    if (typeof dateObj.getTime !== "function") return "";
    return Utils.date.format(dateObj, "YYYY-MM-DD");
  }

  public static toDisplayAmount(val: any) {
    const amount = val / 100000;
    return amount.toFixed(1);
  }

  public static numberWithCommas(number: number) {
    const parts = number.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
  }

  public static toGeneratecodeDate(dateVal?: any, fromFormat: string = "DD/MM/YYYY") {
    if (!dateVal) return "";
    let dateObj: Date = new Date();
    if (typeof dateVal === "string") {
      dateVal = dateVal.replace(/^(\d{2,4}-\d{1,2}-\d{1,2})T(\d{1,2}:\d{1,2}:\d{1,2}.\d{1,3})(.*)$/, "$1");
      dateObj = Utils.date.parse(dateVal, fromFormat);
    } else if (typeof dateVal === "object" && typeof dateVal.getTime == "function") {
      dateObj = new Date(dateVal.getTime());
    }
    if (typeof dateObj.getTime !== "function") {
      return "";
    }
    return Utils.date.format(dateObj, "DDMMYY");
  }

  public static checksum(value: string | Buffer, options: any = {}) {
    options.algorithm = options.algorithm || "sha1";
    options.encoding = options.encoding || "hex";

    const hash = crypto.createHash(options.algorithm);
    if (!hash.write) {
      hash.update(value);
    } else {
      hash.write(value);
    }
    return hash.digest(options.encoding);
  }

  public static md5(value: string | Buffer) {
    const hash = crypto.createHash("md5");
    if (!hash.write) {
      hash.update(value);
    } else {
      hash.write(value);
    }
    return hash.digest("hex").toUpperCase();
  }

  public static deleteFile(dir: string, fileName: string, errIgnore: boolean = false) {
    return new Promise((resolve, reject) => {
      if (typeof fileName === "string" && fileName != "") {
        const filePath = pathModule.join(dir, fileName);
        if (fs.existsSync(filePath)) {
          fs.unlink(filePath, (err) => {
            if (err) {
              if (errIgnore) {
                resolve(err.message || err);
              } else {
                reject(err);
              }
            } else {
              resolve(filePath);
            }
          });
        } else {
          if (errIgnore) {
            resolve("File not found.");
          } else {
            reject(new Error("File not found."));
          }
        }
      } else {
        if (errIgnore) {
          resolve("File is empty.");
        } else {
          reject(new Error("File is empty."));
        }
      }
    });
  }

  public static promisify(fn: Function, argsNum?: number) {
    return (thisArgs: any, ...args: any[]) => {
      if (argsNum && args.length > argsNum) {
        args = args.slice(0, argsNum);
      }

      const promise = new Promise((resolve, reject) => {
        if (!args) {
          args = [];
        }
        args.push((err: any, result: any) => {
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        });

        try {
          fn.call(thisArgs, ...args);
        } catch (err) {
          reject(err);
        }
      });
      return promise;
    };
  }

  public static getAllUserFuncs(obj: any): string[] {
    const buildInFuncs = [
      "constructor",
      "__defineGetter__",
      "__defineSetter__",
      "hasOwnProperty",
      "__lookupGetter__",
      "__lookupSetter__",
      "isPrototypeOf",
      "propertyIsEnumerable",
      "toString",
      "valueOf",
      "__proto__",
      "toLocaleString"
    ];
    let props: string[] = [];
    if (!obj) return props;
    let objProto: any = obj;
    do {
      props = props.concat(Object.getOwnPropertyNames(objProto));
    } while (objProto = Object.getPrototypeOf(objProto));

    return props.filter((e, i, arr) => {
      if (!!~buildInFuncs.indexOf(e)) return false;
      return (e != arr[i + 1] && typeof obj[e] == "function");
    });
  }

  public static isMobileClient(userAgent: string) {
    let isMobile = false;
    // device detection
    if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|ipad|iris|kindle|Android|Silk|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(userAgent)
        || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(userAgent.substr(0, 4)))
      isMobile = true;

    return isMobile;
  }

  public static isEmail(email: string) {
    return /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i.test(email);
  }

  public static checkValue(value?: string) {
    return (value == "" || value == "undefined" || value == "NaN") ? "0" : value;
  }

  public static ChangeGmToKPY(Gm?: string) {
    let KPY = "";
    let tmpKPY = 0;
    let tmpKyat = 0;
    let tmpPae = 0;
    let tmpYway = 0;

    if (Gm != "" && parseFloat(Gm) != 0.0) {
        tmpKPY = parseFloat(Gm) / 16.6;
        let parts = [];
        parts = tmpKPY.toString().split(".");
        const K1 = parseInt(parts[0]);
        let K2 = 0.0;
        if (parts.length >= 2) {
          K2 = parseFloat("." + (parts[1].toString()));
        }
        tmpKyat = K1;
        tmpKPY = K2 * 16;

        parts = tmpKPY.toString().split(".");

        const P1 = parseInt(parts[0]);
        let P2 = 0.0;
        if (parts.length >= 2) {
            P2 = parseFloat("." + (parts[1].toString()));
        }
        tmpPae = P1;
        tmpKPY = P2 * 8;
        parts = tmpKPY.toString().split(".");
        let Yway = parseFloat(parts[0].toString());
        if (parts.length >= 2) {
            if (parts[1].toString().length >= 2) {
                Yway = parseFloat(parts[0].toString() + "." + (parts[1].toString().substring(0, 2).toString()));
            }
            else {
                Yway = parseFloat(parts[0].toString() + "." + (parts[1].toString().substring(0, 1).toString()));
                const tmp = parseInt(parts[1].toString().substring( 0, 1 ));
                if (tmp == 0 || tmp == 1 || tmp == 2 || tmp == 3) {
                    Yway = parseFloat(parts[0].toString());
                }
                else if (tmp == 4 || tmp == 5 || tmp == 6 || tmp == 7) {
                    Yway = parseFloat(parts[0].toString() + ".5");
                }
                else if (tmp == 8 || tmp == 9) {
                  let tmpOne = parseInt(parts[0].toString());
                  tmpOne = tmpOne + 1;
                  Yway = parseFloat(tmpOne.toString());
                }
            }
        }
        tmpYway = Yway;
        if (tmpYway >= 8) {
            tmpPae = tmpPae + (tmpYway % 8);
            tmpYway = tmpYway / 8;
        }
        if (tmpPae >= 16) {
            tmpKyat = tmpKyat + (tmpPae % 8);
            tmpPae = tmpPae / 16;
            let tmpP = [];
            if (tmpPae.toString().includes(".")) {
                tmpP = tmpPae.toString().split(".");
                tmpPae = parseFloat(tmpP[0].toString());
            }
        }
        KPY = tmpKyat.toString() + "-" + tmpPae.toString() + "-" + tmpYway.toString();
    }
    return KPY;
  }

  public static ChangeKPYToGm(Kyat?: string, Pae?: string, Yway?: string) {
      let tmpGm = 0;
      let tmpKyat = 0;
      let tmpPae = 0;
      let tmpYway = 0;
      let plusminussign = "";

      if (parseInt(Kyat) < 0) {
          Kyat = (parseFloat(Kyat) * -1).toString();
          plusminussign = "-";
      }
      if (parseInt(Pae) < 0) {
          Pae = (parseFloat(Pae) * -1).toString();
          plusminussign = "-";
      }
      if (parseFloat(Yway) < 0) {
          Yway = (parseFloat(Yway) * -1).toString();
          plusminussign = "-";
      }
      tmpYway = parseFloat(Yway) / 8;
      tmpGm = tmpYway;

      tmpPae = (tmpYway + parseFloat(Pae)) / 16;
      tmpGm = tmpPae;

      tmpKyat = tmpPae + parseFloat(Kyat);
      tmpGm = tmpKyat;

      tmpGm = tmpGm * 16.6;
      tmpGm = parseFloat(plusminussign + tmpGm);
      return tmpGm;
      // return Math.Truncate(tmpGm * 100) / 100;
  }

  public static ChangeKPYToKyat(Kyat?: string, Pae?: string, Yway?: string) {
    let returnKyat = 0;
    let tmpKyat = 0;
    let tmpPae = 0;
    let tmpYway = 0;

    tmpYway = parseFloat(Yway) / 8;
    returnKyat = tmpYway;

    tmpPae = (tmpYway + parseFloat(Pae)) / 16;
    returnKyat = tmpPae;

    tmpKyat = tmpPae + parseFloat(Kyat);
    returnKyat = tmpKyat;

    return returnKyat;
  }

  public static CheckKPY(_k?: string, _p?: string, _y?: string) {
    let KyatPaeYway = "";
    let retKyat = parseInt(_k), retPae = parseFloat(_p), retYway = 0, retYwayTwo = 0;
    let tmpKPY = [];
    let tmpArrY = [];
    let tmp = "0";

    /*Yway*/
    if (parseFloat(_y) != 0) {
        tmpKPY = _y.split(".");
        retYway = parseFloat(tmpKPY[0].toString());

        if (tmpKPY.length >= 2) {
            retYwayTwo = parseFloat(tmpKPY[1].toString());
            if (tmpKPY[1].toString().length >= 2) {
                if (tmpKPY[1].toString().substring(0, 1) == "0") {
                    tmp = "0";
                    retYwayTwo = parseFloat("." + tmpKPY[1].toString());
                    if (retYway == 0) {
                        retYway = retYwayTwo;
                        retYwayTwo = 0;
                    }
                }
                else  {
                    tmp = "1";
                    retYwayTwo = parseFloat(tmpKPY[1].toString());
                }
            }

            if (retYwayTwo == 0 || retYwayTwo == 1 || retYwayTwo == 2) {
                retYwayTwo = 0;
            }
            else if (retYwayTwo == 3 || retYwayTwo == 4 || retYwayTwo == 5 || retYwayTwo == 6) {
                retYwayTwo = 5;
            }
            else if (retYwayTwo == 7 || retYwayTwo == 8 || retYwayTwo == 9) {
                retYway = retYway + 1;
                retYwayTwo = 0;
            }
        }
    }

    if (retYway >= 8) {
      tmpArrY = (retYway / 8).toString().split(".");
      retPae =  (parseFloat(tmpArrY[0].toString())) + retPae;
      retYway = retYway % 8;
    }

    /*Pae*/

    if (retPae >= 16) {
      tmpArrY = (retPae / 16).toString().split(".");
      retKyat = retKyat + (parseFloat(tmpArrY[0].toString()));
      retPae = retPae % 16;
    }

    if (retYwayTwo > 0 && retYway != 0) {
      let tmpchkdecimal = [];
      tmpchkdecimal = (retYway.toString() + "." + retYwayTwo.toString()).split(".");
      if (tmpchkdecimal.length > 2) {
          KyatPaeYway = retKyat.toString() + "," + retPae.toString() + "," + (retYway + retYwayTwo).toString();
      }
      else {
          KyatPaeYway = retKyat.toString() + "," + retPae.toString() + "," + retYway.toString() + "." + retYwayTwo.toString();
      }
    }
    else if (retYway == 0 && tmp == "1") {
        KyatPaeYway = retKyat.toString() + "," + retPae.toString() + "," + retYway.toString() + "." + retYwayTwo.toString();
    }
    else {
        KyatPaeYway = retKyat.toString() + "," + retPae.toString() + "," + retYway.toString();
    }
    return KyatPaeYway;
  }

  public static calc_gold_amount(_gm?: string, _goldrate_amount?: string) {
    let gold_amount = 0;
    let net_k = 0;
    net_k = parseFloat(_gm) / 16.6;
    gold_amount = (net_k * parseFloat(_goldrate_amount));
    return gold_amount;
  }

  public static calc_amount_from_kpy(_k?: string, _p?: string, _y?: string, current_rate?: string) {
    let tmpGm = 0;
    let tmpKyat = 0;
    let tmpPae = 0;
    let tmpYway = 0;
    let plusminussign = "";
    let gold_amount = 0;
    let net_k = 0;

    if (parseInt(_k) < 0) {
        _k = (parseFloat(_k) * -1).toString();
        plusminussign = "-";
    }
    if (parseInt(_p) < 0) {
        _p = (parseFloat(_p) * -1).toString();
        plusminussign = "-";
    }
    if (parseFloat(_y) < 0) {
        _y = (parseFloat(_y) * -1).toString();
        plusminussign = "-";
    }
    tmpYway = parseFloat(_y) / 8;
    tmpGm = tmpYway;

    tmpPae = (tmpYway + parseFloat(_p)) / 16;
    tmpGm = tmpPae;

    tmpKyat = tmpPae + parseFloat(_k);
    tmpGm = tmpKyat;

    tmpGm = tmpGm * 16.6;
    tmpGm = parseFloat(plusminussign + tmpGm);

    net_k = tmpGm / 16.6;
    gold_amount = (net_k * parseFloat(current_rate));
    const data: any = {
      wgt_gm: tmpGm,
      price: gold_amount
    };
    return data;
  }

  public static calc_wgtpluslosskpy_minusgemkpy(_k?: string, _p?: string, _y?: string, _gem_k?: string, _gem_p?: string, _gem_y?: string) {
    const p_in_y = 8;
    const k_in_p = 16;
    let tmp_tot_y = 0;
    let tmp_tot_p = 0, tmp_tot_k = 0;
    let tmp_tot_kpy = "";

    let netloss_k = parseInt(_k);
    let netloss_p = parseInt(_p);
    let netloss_y = parseFloat(_y);

    const gem_k = parseInt(_gem_k);
    const gem_p = parseInt(_gem_p);
    const gem_y = parseFloat(_gem_y);

    if (gem_y > netloss_y) {
      if (netloss_p == 0) {
        netloss_k = netloss_k - 1;
        netloss_p = netloss_p + 16;
        netloss_y = netloss_y + 8;
      }
      else {
        netloss_p = netloss_p - 1;
        netloss_y = netloss_y + 8;
      }
    }
    if (gem_p > netloss_p) {
      if (netloss_k != 0) {
        netloss_k = netloss_k - 1;
        netloss_p = netloss_p + 16;
      }
    }
    tmp_tot_y = netloss_y - gem_y;
    tmp_tot_p = netloss_p - gem_p;
    tmp_tot_k = netloss_k - gem_k;

    if (tmp_tot_y > p_in_y) {
      tmp_tot_y = (tmp_tot_y % p_in_y);
      const tmp = (netloss_y - gem_y) / p_in_y;
      let _tmpp = [];
      _tmpp = tmp.toString().split(".");
      tmp_tot_p = tmp_tot_p + parseInt(_tmpp[0].toString());
    }
    if (tmp_tot_p > k_in_p) {
      tmp_tot_p = tmp_tot_p / k_in_p;
      tmp_tot_k = tmp_tot_k + (tmp_tot_p % k_in_p);
    }
    if (tmp_tot_k < 0) tmp_tot_k = tmp_tot_k * (-1);
    if (tmp_tot_p < 0) tmp_tot_p = tmp_tot_p * (-1);
    if (tmp_tot_y < 0) tmp_tot_y = tmp_tot_y * (-1);

    tmp_tot_kpy = tmp_tot_k + "," + tmp_tot_p + "," + tmp_tot_y.toFixed(2);
    return tmp_tot_kpy;
  }

  public static calc_tot_amount(_netwgt_gm?: string, _goldrate_amount?: string, _gemprice?: string, _service_charge?: string) {
    let tot_amount = 0;
    let net_k = 0;
    net_k =  parseFloat(_netwgt_gm) / 16.6;
    tot_amount = (net_k * parseFloat(_goldrate_amount)) + parseFloat(_gemprice) + parseFloat(_service_charge);
    tot_amount = tot_amount + parseFloat(_gemprice) + parseFloat(_service_charge);
    return tot_amount;
  }

  public static calc_total(wgt_gm?: string, goldrate_price?: string) {
    let total_amt = 0;
    let net_k = 0;
    net_k = parseFloat(wgt_gm) / 16.6;
    total_amt = net_k * parseFloat(goldrate_price);
    return total_amt;
  }

  public static addComma(amount?: any) {
    const amt = amount.toString().split(".");
    // const price = amount.toFixed(2);
    // const amt = price.toString().split(".");
    let amtWithUSD = amt[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    if (amt[1] && amt[1] != "") {
      amtWithUSD = amtWithUSD + "." + amt[1];
    } else {
      // amtWithUSD = amtWithUSD + ".00";
    }
    return amtWithUSD;
  }

  public static removeComma(amount?: any) {
    const amt = amount.replace(/,/g, '');
    return amt;
  }
}