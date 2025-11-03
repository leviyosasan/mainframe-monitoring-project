const express = require('express');
const { testConnection, getMainviewMvsSysover, getMainviewMvsJespool,
  checkTableExists,checkTableExistsJespool, getMainviewMvsJCPU, checkTableExistsJCPU, getLatestCpuData, checkTableExistsStacks, 
  getMainviewNetworkStacks, checkTableExistsStackCPU, getMainviewNetworkStackCPU, checkTableExistsVtamcsa, 
  getMainviewNetworkVtamcsa, getMainviewNetworkTcpconf, checkTableExiststcpconf,
  getMainviewNetworktcpcons, checkTableExiststcpcons, getMainviewNetworkudpconf, checkTableExiststudpconf,
  getMainviewNetworkactcons, checkTableExistsactcons, getMainviewUSSZFS, checkTableExistsZFS,
  // MQ
  checkTableExistsMQConnz, getMainviewMQConnz,
  checkTableExistsMQQm, getMainviewMQQm,
  checkTableExistsMQW2over, getMainviewMQW2over,
  // Storage
  checkTableExistsCsasum, getMainviewStorageCsasum,
  checkTableExistsFrminfoCenter, getMainviewStorageFrminfoCenter,
  checkTableExistsFrminfoFixed, getMainviewStorageFrminfofixed,
  checkTableExistsFrminfoHighVirtual, getMainviewStorageFrminfoHighVirtual,
  checkTableExistsSysfrmiz, getMainviewStoragesysfrmiz,
} = require('../controllers/database.controller');

// New network tables
const {
  checkTableExistsVtmbuff,
  getMainviewNetworkVtmbuff,
  checkTableExistsTcpstor,
  getMainviewNetworkTcpstor,
  checkTableExistsConnsrpz,
  getMainviewNetworkConnsrpz
} = require('../controllers/database.controller');

// RMF tables
const {
  checkTableExistsRmfPgspp, getMainviewRmfPgspp,
  checkTableExistsRmfArd, getMainviewRmfArd,
  checkTableExistsRmfTrx, getMainviewRmfTrx,
  checkTableExistsRmfAsrm, getMainviewRmfAsrm,
  checkTableExistsRmfSrcs, getMainviewRmfSrcs,
  checkTableExistsRmfAsd, getMainviewRmfAsd,
  checkTableExistsRmfSpag, getMainviewRmfSpag,
  checkTableExistsCmfDspcz, getMainviewCmfDspcz,
  checkTableExistsCmfXcfsys, getMainviewCmfXcfsys,
  checkTableExistsCmfJcsa, getMainviewCmfJcsa,
  checkTableExistsCmfXcfmbr, getMainviewCmfXcfmbr,
  checkTableExistsCmfSyscpc, getMainviewCmfSyscpc
} = require('../controllers/database.controller');

const router = express.Router();

// Test database connection
router.post('/test-connection', testConnection);

// Get mainview_mvs_sysover data
router.post('/mainview-mvs-sysover', getMainviewMvsSysover);

//Get mainview_mvs_jespool data

router.post('/mainview-mvs-jespool', getMainviewMvsJespool);

// Check table exists and get info
router.post('/check-table', checkTableExists);

// Check table exists and get info
router.post('/check-table-jespool', checkTableExistsJespool);

// Get mainview_mvs_jcpu data
router.post('/mainview-mvs-jcpu', getMainviewMvsJCPU);

// Check table exists for jcpu
router.post('/check-table-jcpu', checkTableExistsJCPU);

// Get latest CPU data
router.post('/latest-cpu', getLatestCpuData);

// Check table exists for stacks
router.post('/check-table-stacks', checkTableExistsStacks);

// Get mainview_network_stacks data
router.post('/mainview-network-stacks', getMainviewNetworkStacks);

// Check table exists for stackcpu
router.post('/check-table-stackcpu', checkTableExistsStackCPU);

// Get mainview_network_stackcpu data
router.post('/mainview-network-stackcpu', getMainviewNetworkStackCPU);

// Check table exists for vtamcsa
router.post('/check-table-vtamcsa', checkTableExistsVtamcsa);

// Get mainview_network_vtamcsa data
router.post('/mainview-network-vtamcsa', getMainviewNetworkVtamcsa);

router.post('/mainview-network-tcpconf', getMainviewNetworkTcpconf);
 
// Check table exists for tcpconf
router.post('/check-table-tcpconf', checkTableExiststcpconf);
 
// Get mainview_network_tcpcons data
router.post('/mainview-network-tcpcons', getMainviewNetworktcpcons);
 
// Check table exists for tcpcons
router.post('/check-table-tcpcons', checkTableExiststcpcons);
 
// Get mainview_network_udpconf data
router.post('/mainview-network-udpconf', getMainviewNetworkudpconf);
 
// Check table exists for udpconf
router.post('/check-table-udpconf', checkTableExiststudpconf);
 
// Get mainview_network_actcons data
router.post('/mainview-network-actcons', getMainviewNetworkactcons);
 
// Check table exists for actcons
router.post('/check-table-actcons', checkTableExistsactcons);

// VTMBUFF
router.post('/mainview-network-vtmbuff', getMainviewNetworkVtmbuff);
router.post('/check-table-vtmbuff', checkTableExistsVtmbuff);

// TCPSTOR
router.post('/mainview-network-tcpstor', getMainviewNetworkTcpstor);
router.post('/check-table-tcpstor', checkTableExistsTcpstor);

// CONNSRPZ
router.post('/mainview-network-connsrpz', getMainviewNetworkConnsrpz);
router.post('/check-table-connsrpz', checkTableExistsConnsrpz);

// ZFS
router.post('/mainview-uss-zfs', getMainviewUSSZFS);
router.post('/check-table-zfs', checkTableExistsZFS);

// MQ endpoints
router.post('/mainview-mq-connz', getMainviewMQConnz);
router.post('/check-table-mq-connz', checkTableExistsMQConnz);

router.post('/mainview-mq-qm', getMainviewMQQm);
router.post('/check-table-mq-qm', checkTableExistsMQQm);

router.post('/mainview-mq-w2over', getMainviewMQW2over);
router.post('/check-table-mq-w2over', checkTableExistsMQW2over);

// Storage endpoints
router.post('/mainview-storage-csasum', getMainviewStorageCsasum);
router.post('/check-table-csasum', checkTableExistsCsasum);

router.post('/mainview-storage-frminfo-central', getMainviewStorageFrminfoCenter);
router.post('/check-table-frminfo-central', checkTableExistsFrminfoCenter);

router.post('/mainview-storage-frminfo-fixed', getMainviewStorageFrminfofixed);
router.post('/check-table-frminfo-fixed', checkTableExistsFrminfoFixed);

router.post('/mainview-storage-frminfo-high-virtual', getMainviewStorageFrminfoHighVirtual);
router.post('/check-table-frminfo-high-virtual', checkTableExistsFrminfoHighVirtual);

router.post('/mainview-storage-sysfrmiz', getMainviewStoragesysfrmiz);
router.post('/check-table-sysfrmiz', checkTableExistsSysfrmiz);

// RMF endpoints
router.post('/mainview-rmf-pgspp', getMainviewRmfPgspp);
router.post('/check-table-rmf-pgspp', checkTableExistsRmfPgspp);

router.post('/mainview-rmf-ard', getMainviewRmfArd);
router.post('/check-table-rmf-ard', checkTableExistsRmfArd);

router.post('/mainview-rmf-trx', getMainviewRmfTrx);
router.post('/check-table-rmf-trx', checkTableExistsRmfTrx);

router.post('/mainview-rmf-asrm', getMainviewRmfAsrm);
router.post('/check-table-rmf-asrm', checkTableExistsRmfAsrm);

router.post('/mainview-rmf-srcs', getMainviewRmfSrcs);
router.post('/check-table-rmf-srcs', checkTableExistsRmfSrcs);

router.post('/mainview-rmf-asd', getMainviewRmfAsd);
router.post('/check-table-rmf-asd', checkTableExistsRmfAsd);

router.post('/mainview-rmf-spag', getMainviewRmfSpag);
router.post('/check-table-rmf-spag', checkTableExistsRmfSpag);

// CMF endpoints
router.post('/mainview-cmf-dspcz', getMainviewCmfDspcz);
router.post('/check-table-cmf-dspcz', checkTableExistsCmfDspcz);

router.post('/mainview-cmf-xcfsys', getMainviewCmfXcfsys);
router.post('/check-table-cmf-xcfsys', checkTableExistsCmfXcfsys);

router.post('/mainview-cmf-jcsa', getMainviewCmfJcsa);
router.post('/check-table-cmf-jcsa', checkTableExistsCmfJcsa);

router.post('/mainview-cmf-xcfmbr', getMainviewCmfXcfmbr);
router.post('/check-table-cmf-xcfmbr', checkTableExistsCmfXcfmbr);

router.post('/mainview-cmf-syscpc', getMainviewCmfSyscpc);
router.post('/check-table-cmf-syscpc', checkTableExistsCmfSyscpc);

module.exports = router;
