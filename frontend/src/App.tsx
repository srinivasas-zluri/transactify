import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "tailwindcss/tailwind.css";

import { PageState, useAppState } from "./hooks/useAppState";
import { UploadingFile } from "./pages/uploadingFileLoadingPage";
import { TransactionTable } from "./components/Table/TransactionTable";
import { TransactionManagementLoadingPage } from "./components/TransactionManagement/LoadingPage";
import { UploadFile } from "./components/TransactionManagement/UploadFile";
import { PaginationComponent } from "./components/Table/Pagination";

const App = () => {
  return (
    <>
      <ToastContainer />
      <ApplicationPage />
    </>
  );
};

const ApplicationPage = () => {
  const {
    pageState,
    progress,
    transactions,
    handleInputChange,
    editingTransaction,
    setPage,
    page,
    prev,
    next,
    uploadFile,
    onCreateTransaction,
    onEditCancelClicked,
    onEditClicked,
    onEditSaveClicked,
    onDeleteClicked,
  } = useAppState({ toast });

  if (pageState === PageState.UploadingFile) {
    return <UploadingFile progress={progress} />
  }

  if (pageState === PageState.Loading) {
    return <TransactionManagementLoadingPage />;
  }
  console.log({transactions, prev,  next})

  const isDataNull = transactions.length === 0 && prev.page === null && next.page === null;

  return (
    <div className="mx-auto p-8 rounded-lg max-w-7xl">
      <h1 className="mb-8 font-semibold text-4xl text-center text-gray-800">Transaction Management</h1>
      <UploadFile onUpload={uploadFile} toast={toast} />

      {(!isDataNull) && <PaginationComponent page={page} prev={prev} next={next} setPage={setPage} />}
      <span className="p-10" />
      <TransactionTable
        pageState={pageState}
        transactions={transactions}
        handleInputChange={handleInputChange}
        editingTransaction={editingTransaction}
        onEditCancelClicked={onEditCancelClicked}
        onEditClicked={onEditClicked}
        onEditSaveClicked={onEditSaveClicked}
        onDeleteClicked={onDeleteClicked}
        onCreateTransaction={onCreateTransaction}
      />

      <span className="p-10" />
      {(!isDataNull) && <PaginationComponent page={page} prev={prev} next={next} setPage={setPage} />}
    </div>
  );
};




export default App;
