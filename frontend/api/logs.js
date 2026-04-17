import { apiRequest } from "./client";

//get logs
export const getLogs = (token, params = {}) => {
  const query = new URLSearchParams(params).toString();
  return apiRequest(`/logs?${query}`, {
    method: "GET",
    token,
  });
};

//create log
export const createLog = (token, data) =>
  apiRequest("/logs", {
    method: "POST",
    token,
    body: data,
  });

//update log
export const updateLog = (token, id, data) =>
  apiRequest(`/logs/${id}`, {
    method: "PUT",
    token,
    body: data,
  });

//delete log
export const deleteLog = (token, id) =>
  apiRequest(`/logs/${id}`, {
    method: "DELETE",
    token,
  });
