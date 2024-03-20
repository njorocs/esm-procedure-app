import React, { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useGetOrdersWorklist } from "../work-list/work-list.resource";
import {
  ErrorState,
  formatDate,
  parseDate,
  showModal,
  usePagination,
} from "@openmrs/esm-framework";
import {
  DataTable,
  DataTableSkeleton,
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
  TableToolbar,
  TableToolbarContent,
  TableToolbarSearch,
  Layer,
  Tile,
  DatePicker,
  DatePickerInput,
  Button,
  Tag,
} from "@carbon/react";

import styles from "./review-list.scss";
import { Add } from "@carbon/react/icons";
import { getStatusColor } from "../utils/functions";

interface ReviewlistProps {
  fulfillerStatus: string;
}
interface ApproveResultMenuProps {
  encounterUuid: string;
}

const ApproveTestMenu: React.FC<ApproveResultMenuProps> = ({
  encounterUuid,
}) => {
  const { t } = useTranslation();
  const launchReviewItemModal = useCallback(() => {
    const dispose = showModal("review-item-dialog", {
      encounterUuid,
      closeModal: () => dispose(),
    });
  }, [encounterUuid]);

  return (
    <Button
      kind="ghost"
      onClick={launchReviewItemModal}
      iconDescription={t("approveTest", "Approve Results")}
      renderIcon={(props) => <Add size={16} {...props} />}
    >
      {t("approveTest", "Approve Results")}
    </Button>
  );
};

const ReviewList: React.FC<ReviewlistProps> = ({ fulfillerStatus }) => {
  const { t } = useTranslation();

  const [activatedOnOrAfterDate, setActivatedOnOrAfterDate] = useState("");

  const { workListEntries, isLoading } = useGetOrdersWorklist("",fulfillerStatus);

  const pageSizes = [10, 20, 30, 40, 50];
  const [currentPageSize, setPageSize] = useState(10);

  const {
    goTo,
    results: paginatedWorkListEntries,
    currentPage,
  } = usePagination(workListEntries, currentPageSize);

  // get picked orders
  const columns = [
    { id: 0, header: t("date", "Date"), key: "date" },
    { id: 1, header: t("orderNumber", "Procedure Number"), key: "orderNumber" },
    { id: 2, header: t("procedure", "Procedure"), key: "procedure" },
    { id: 3, header: t("patient", "Patient"), key: "patient" },
    { id: 4, header: t("priority", "Priority"), key: "urgency" },
    { id: 5, header: t("orderer", "Orderer"), key: "orderer" },
    { id: 6, header: t("actions", "Actions"), key: "actions" },
  ];

  const tableRows = useMemo(() => {
    return paginatedWorkListEntries
      ?.filter(
        (item) =>
          (item.action === "DISCONTINUE" || item.action === "REVISE") &&
          item.fulfillerStatus === "IN_PROGRESS"
      )
      .map((entry) => ({
        ...entry,
        id: entry?.uuid,
        date: formatDate(parseDate(entry?.dateActivated)),
        patient: entry?.patient?.display.split("-")[1],
        orderNumber: entry?.orderNumber,
        accessionNumber: entry?.accessionNumber,
        test: entry?.concept?.display,
        action: entry?.action,
        status: (
          <span
            className={styles.statusContainer}
            style={{ color: `${getStatusColor(entry?.fulfillerStatus)}` }}
          >
            {entry?.fulfillerStatus}
          </span>
        ),
        orderer: entry?.orderer?.display,
        orderType: entry?.orderType?.display,
        urgency: entry?.urgency,
      }));
  }, [paginatedWorkListEntries]);

  if (isLoading) {
    return <DataTableSkeleton role="progressbar" />;
  }
  if (paginatedWorkListEntries?.length >= 0) {
    return (
      <DataTable rows={tableRows} headers={columns} useZebraStyles>
        {({
          rows,
          headers,
          getHeaderProps,
          getTableProps,
          getRowProps,
          onInputChange,
        }) => (
          <TableContainer className={styles.tableContainer}>
            <TableToolbar
              style={{
                position: "static",
              }}
            >
              <TableToolbarContent>
                <Layer>
                  <TableToolbarSearch
                    expanded
                    onChange={onInputChange}
                    placeholder={t("searchThisList", "Search this list")}
                    size="sm"
                  />
                </Layer>
              </TableToolbarContent>
            </TableToolbar>
            <Table {...getTableProps()} className={styles.activePatientsTable}>
              <TableHead>
                <TableRow>
                  {headers.map((header) => (
                    <TableHeader {...getHeaderProps({ header })}>
                      {header.header?.content ?? header.header}
                    </TableHeader>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row, index) => {
                  return (
                    <React.Fragment key={row.id}>
                      <TableRow {...getRowProps({ row })} key={row.id}>
                        {row.cells.map((cell) => (
                          <TableCell key={cell.id}>
                            {cell.value?.content ?? cell.value}
                          </TableCell>
                        ))}
                        <TableCell className="cds--table-column-menu">
                          <ApproveTestMenu
                            encounterUuid={
                              paginatedWorkListEntries[index]?.encounter?.uuid
                            }
                          />
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  );
                })}
              </TableBody>
            </Table>
            {rows.length === 0 ? (
              <div className={styles.tileContainer}>
                <Tile className={styles.tile}>
                  <div className={styles.tileContent}>
                    <p className={styles.content}>
                      {t("noReviewListToDisplay", "No review list to display")}
                    </p>
                  </div>
                </Tile>
              </div>
            ) : null}
            <Pagination
              forwardText="Next page"
              backwardText="Previous page"
              page={currentPage}
              pageSize={currentPageSize}
              pageSizes={pageSizes}
              totalItems={workListEntries?.length}
              className={styles.pagination}
              onChange={({ pageSize, page }) => {
                if (pageSize !== currentPageSize) {
                  setPageSize(pageSize);
                }
                if (page !== currentPage) {
                  goTo(page);
                }
              }}
            />
          </TableContainer>
        )}
      </DataTable>
    );
  }
};

export default ReviewList;
