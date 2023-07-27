/*
 * Copyright 2023 pyamsoft
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import axios, { AxiosResponse } from "axios";
import { CookieJar } from "tough-cookie";
import { wrapper } from "axios-cookiejar-support";

export const cookieJar = new CookieJar();
const client = wrapper(axios.create({ jar: cookieJar }));

export const jsonApi = function <T>(url: string): Promise<T> {
  return client({
    method: "GET",
    url,
    withCredentials: true,
  }).then((r: AxiosResponse<T>) => r.data);
};

export const htmlApi = function <T>(url: string): Promise<T> {
  return client({
    method: "GET",
    url,
    withCredentials: true,
    headers: {
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    },
  }).then((r: AxiosResponse<T>) => r.data);
};
