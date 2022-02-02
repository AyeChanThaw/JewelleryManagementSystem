/**
 * POST JSON Body Data Parsing Library
 */
import express from "express";

class Parser {
  public data: any;

  constructor(data?: any) {
    if (data) {
      this.parsePostData(data);
    }
  }

  public parsePostData(data: any) {
    if (typeof data !== "object" || Array.isArray(data)) {
      return data;
    }
    const result: any = {};
    const temp: any = {};
    for (const key in data) {
      let match = key.match(/^([^\[]+)(\[[^\s]+\])$/);
      if (!match) {
        match = key.match(/^(.*)\[\]$/);
        const value = this.parseJsonData(data[key]);
        if (match) {
          result[match[1]] = value;
        } else {
          result[key] = value;
        }
      } else {
        if (typeof result[match[1]] === "undefined") {
          const match1 = match[2].match(/^\[([\d]+)\](.*?)$/);
          if (match1) {
            result[match[1]] = [];
          } else {
            result[match[1]] = {};
          }
          temp[match[1]] = {};
        }
        temp[match[1]][match[2]] = this.parseJsonData(data[key]);
      }
    }

    for (const key in result) {
      if (Array.isArray(result[key])) {
        this.createArray(temp[key], result[key]);
      } else if (typeof result[key] === "object") {
        this.createObject(temp[key], result[key]);
      }
    }
    this.data = result;
  }

  private parseJsonData(value: any) {
    let obj: any = undefined;
    const match = `${value}`.match(/^[\{\[](.*)[\]\}]$/);
    if (match) {
      try {
        obj = JSON.parse(`${value}`);
      } catch {
        obj = value;
      }
    } else {
      obj = value;
    }
    return obj;
  }

  private createArray(obj: any, result: any) {
    const temp: any = [];
    for (const key in obj) {
      const match = key.match(/^\[([\d]+)\](.*?)$/);
      if (match) {
        const arrayIndex = parseInt(match[1]);
        if (typeof result[arrayIndex] == "undefined") {
          const match1 = match[2].match(/^\[([\d]+)\](.*?)$/);
          if (match1) {
            result.push([]);
          } else {
            result.push({});
          }
          temp[arrayIndex] = {};
        }
        temp[arrayIndex][match[2]] = this.parseJsonData(obj[key]);
      }
    }

    for (const key in temp) {
      if (Array.isArray(result[key])) {
        this.createArray(temp[key], result[key]);
      } else if (typeof result[key] === "object") {
        this.createObject(temp[key], result[key]);
      }
    }
  }

  private createObject(obj: any, result: any) {
    const temp: any = {};
    for (const key in obj) {
      const match = key.match(/^\[([^\[]+)\](.*?)$/);
      if (match) {
        if (typeof match[2] === "undefined" || match[2] == "") {
          result[match[1]] = obj[key];
        } else {
          if (typeof result[match[1]] === "undefined") {
            const match1 = match[2].match(/^\[([\d]+)\](.*?)$/);
            if (match1) {
              result[match[1]] = [];
            } else {
              result[match[1]] = {};
            }
            temp[match[1]] = {};
          }
          temp[match[1]][match[2]] = this.parseJsonData(obj[key]);
        }
      }
    }
    for (const key in temp) {
      if (Array.isArray(result[key])) {
        this.createArray(temp[key], result[key]);
      } else if (typeof result[key] === "object") {
        this.createObject(temp[key], result[key]);
      }
    }
  }
}

export function jsonBodyParser(req: express.Request, res: express.Response, next: express.NextFunction) {
  if ((<any>req)._postdata || req.method != "POST") {
    return next();
  }

  const postData = req.body;
  // no data
  if (!postData) {
    (<any>req)._postdata = true;
    return next();
  }
  const parser = new Parser(postData);
  req.body = parser.data;
  (<any>req)._postdata = true;
  next();
}