(function () {
  async function apiRequest(url, options = {}) {
    const res = await fetch(url, options);
    return res.json();
  }

  function jsonOptions(method, body) {
    return {
      method,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    };
  }

  function apiGet(url) {
    return apiRequest(url);
  }

  function apiPost(url, body) {
    return apiRequest(url, jsonOptions("POST", body));
  }

  function apiPut(url, body) {
    return apiRequest(url, jsonOptions("PUT", body));
  }

  function apiDelete(url) {
    return apiRequest(url, { method: "DELETE" });
  }

  window.apiRequest = window.apiRequest || apiRequest;
  window.apiGet = window.apiGet || apiGet;
  window.apiPost = window.apiPost || apiPost;
  window.apiPut = window.apiPut || apiPut;
  window.apiDelete = window.apiDelete || apiDelete;
})();
