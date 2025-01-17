// create a simple object wiht the routes of the app

const mergeRoutes = (url1: string, url2: string) => {
  const res =  url1.replace(/\/+$/, "") + "/" + url2.replace(/^\/+/, "");
  res.replace(/\/+$/, "");
  console.log({ url: res });
  return res;
};

const rootURL = "http://localhost:3000";
const apiURL = mergeRoutes(rootURL, "/api/v1");
const transactionsURL = mergeRoutes(apiURL, "/transaction");

export const routes = {
  transactions: {
    upload: mergeRoutes(transactionsURL, "/upload"),
    fetch: ({ page }: { page: number }) =>
      mergeRoutes(transactionsURL, `?page=${page}&limit=50`),
    delete: ({ id }: { id: number }) => mergeRoutes(transactionsURL, `/${id}`),
    update: ({ id }: { id: number }) => mergeRoutes(transactionsURL, `/${id}`),
  },
};
