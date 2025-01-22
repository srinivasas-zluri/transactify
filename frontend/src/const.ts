const mergeRoutes = (url1: string, url2: string) => {
  const res = url1.replace(/\/+$/, "") + "/" + url2.replace(/^\/+/, "");
  res.replace(/\/+$/, "");
  console.log({ url: res });
  return res;
};

// read the root url from env
const rootURL = import.meta.env.VITE_API_ROOT_URL;
if (!rootURL) {
  throw new Error("API_ROOT_URL is not defined");
}

// const rootURL = "http://localhost:3000";
const apiURL = mergeRoutes(rootURL, "/api/v1");
const transactionsURL = mergeRoutes(apiURL, "/transaction");

export const routes = {
  transactions: {
    upload: mergeRoutes(transactionsURL, "/upload"),
    fetch: ({ page }: { page: number }) =>
      mergeRoutes(transactionsURL, `?page=${page}&limit=50`),
    create: mergeRoutes(transactionsURL, "/"),
    delete: mergeRoutes(transactionsURL, "/"),
    update: ({ id }: { id: number }) => mergeRoutes(transactionsURL, `/${id}`),
  },
};
