import axios, { AxiosResponse } from "axios";

export const jsonApi = async function <T>(url: string): Promise<T> {
  return axios({
    method: "GET",
    url,
  }).then((r: AxiosResponse<T>) => r.data);
};
