var cmd = require('node-cmd'),
    config = require('./config.json'),
    gulp = require('gulp-help')(require('gulp')),
    gulpSequence = require('gulp-sequence'),
    PluginError = require('plugin-error');


/**
 * await Job Callback - Callback is made without error if Job completes with 
 * CC < MaxRC in the allotted time
 * @callback awaitJobCallback
 * @param {Error} err 
 */

 /**
 * await SSMState Callback - Callback is made without error if desired state is 
 * reached within the the allotted time
 * @callback awaitSSMStateCallback
 * @param {Error} err 
 */

/**
* Polls state of SSM managed resource. Callback is made without error if desired state is 
* reached within the the allotted time
* @param {string}                 resource      SSM managed resource to check the state of
* @param {string}                 desiredState  desired state of resource
* @param {awaitSSMStateCallback}  callback      function to call after completion
* @param {number}                 tries         max attempts to check the completion of the job
* @param {number}                 wait          wait time in ms between each check
*/
function awaitSSMState(resource, desiredState, callback, tries = 30, wait = 1000) {
  if (tries > 0) {
    sleep(wait);
    cmd.get(
    'zowe ops show resource ' + resource,
    function (err, data, stderr) {
      if(err){
        callback(err);
      } else if (stderr){
        callback(new Error("\nCommand:\n" + command + "\n" + stderr + "Stack Trace:"));
      } else {
        //First find the header
        var pattern = new RegExp("current:.*");
        var currentState = data.match(pattern)[0].split(' ')[1];

        //check if currentState is the desiredState
        if (currentState != desiredState) {
          awaitSSMState(resource, desiredState, callback, tries - 1, wait);
        } else { //currentState does equal desiredState so success!
          callback(null);
        }
      }
    });
  } else {
      callback(new Error(resource + " did not reached desired state of " + desiredState + " in the allotted time."));
  }
}

/**
* Changes state of SSM managed resource. Callback is made without error if desired state is 
* reached within the the allotted time
* @param {string}                 resource      SSM managed resource to change the state of
* @param {string}                 state         desired state of resource - UP or DOWN
* @param {awaitSSMStateCallback}  callback      function to call after completion
* @param {string}                 [apf]         data set to APF authorize if required
*/
function changeResourceState(resource, state, callback, apf) {
  var command;
  if(state === "UP") {
    command = 'zowe ops start resource ' + resource;
  } else if(state === "DOWN") {
    command = 'zowe ops stop resource ' + resource;
  } else{
    callback(new Error("\nUnrecognized desired state of: " + state + ". Expected UP or DOWN."));
  }
  
  
  // Submit command, await completion
  cmd.get(command, function (err, data, stderr) {
    if(err){
      callback(err);
    } else if (stderr){
      callback(new Error("\nCommand:\n" + command + "\n" + stderr + "Stack Trace:"));
    } else {
      // Await the SSM Resource Status to be up
      awaitSSMState(resource, state, function(err){
        if(err){
          callback(err);
        } else if(typeof apf !== 'undefined'){
          // Resource state successfully changed and needs APF authorized
          command = 'zowe console issue command "SETPROG APF,ADD,DSNAME=' + apf + ',SMS"';
          simpleCommand(command, callback);
        } else { //Resource state is changed, does not need APF authorized
          callback();
        }
      });
    }
  });
}

/**
* Runs command and calls back without error if successful
* @param {string}           command   command to run
* @param {awaitJobCallback} callback  function to call after completion
*/
function simpleCommand(command, callback){
  cmd.get(command, function(err, data, stderr) { 
    if(err){
      callback(err);
    } else if (stderr){
      callback(new Error("\nCommand:\n" + command + "\n" + stderr + "Stack Trace:"));
    } else {
      callback();
    }
  });
}

/**
 * Sleep function.
 * @param {number} ms Number of ms to sleep
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
* Submits job, verifies successful completion, stores output
* @param {string}           ds                  data-set to submit
* @param {string}           [dir="job-archive"] local directory to download spool to
* @param {number}           [maxRC=0]           maximum allowable return code
* @param {awaitJobCallback} callback            function to call after completion
*/
function submitJobAndDownloadOutput(ds, dir="job-archive", maxRC=0, callback){
  var command = 'zowe jobs submit data-set "' + ds + '" -d ' + dir + " --rfj";
  cmd.get(command, function(err, data, stderr) { 
    if(err){
      callback(err);
    } else if (stderr){
      callback(new Error("\nCommand:\n" + command + "\n" + stderr + "Stack Trace:"));
    } else {
      data = JSON.parse(data).data;
      retcode = data.retcode;

      //retcode should be in the form CC nnnn where nnnn is the return code
      if (retcode.split(" ")[1] <= maxRC) {
        callback(null);
      } else {
        callback(new Error("Job did not complete successfully. Additional diagnostics:" + JSON.stringify(data,null,1)));
      }
    }
  });
}

gulp.task('apf', 'APF authorize dataset', function(callback){
    var ds = config.runtimeEnv + '.' + config.maintainedPds;
        command = 'zowe console issue command "SETPROG APF,ADD,DSNAME=' + ds + ',SMS"';
    simpleCommand(command, callback);
});

gulp.task('apply', 'Apply Maintenance', function (callback) {
  var ds = config.remoteJclPds + '(' + config.applyMember + ')';
  submitJobAndDownloadOutput(ds, "job-archive/apply", 0, callback);
});

gulp.task('apply-check', 'Apply Check Maintenance', function (callback) {
  var ds = config.remoteJclPds + '(' + config.applyCheckMember + ')';
  submitJobAndDownloadOutput(ds, "job-archive/apply-check", 0, callback);
});

gulp.task('copy', 'Copy Maintenance to Runtime', function (callback) {
  var command = 'zowe file-master-plus copy data-set "' + config.smpeEnv + '.' + config.maintainedPds + 
                '" "' + config.runtimeEnv + '.' + config.maintainedPds + '"';
  simpleCommand(command, callback);
});

gulp.task('receive', 'Receive Maintenance', function (callback) {
  var ds = config.remoteJclPds + '(' + config.receiveMember + ')';
  submitJobAndDownloadOutput(ds, "job-archive/receive", 0, callback);
});

gulp.task('reject', 'Reject Maintenance', function (callback) {
  var ds = config.remoteJclPds + '(' + config.rejectMember + ')';
  submitJobAndDownloadOutput(ds, "job-archive/reject", 0, callback);
});

gulp.task('restore', 'Restore Maintenance', function (callback) {
  var ds = config.remoteJclPds + '(' + config.restoreMember + ')';
  submitJobAndDownloadOutput(ds, "job-archive/restore", 0, callback);
});

gulp.task('start1', 'Start SSM managed resource1', function (callback) {
  changeResourceState(config.ssmResource1, "UP", callback);
});

gulp.task('start2', 'Start SSM managed resource2', function (callback) {
  changeResourceState(config.ssmResource2, "UP", callback);
});

gulp.task('stop1', 'Stop SSM managed resource1', function (callback) {
  changeResourceState(config.ssmResource1, "DOWN", callback);
});

gulp.task('stop2', 'Stop SSM managed resource2', function (callback) {
  changeResourceState(config.ssmResource2, "DOWN", callback);
});

gulp.task('upload', 'Upload Maintenance to USS', function (callback) {
  var command = 'zowe files upload ftu "' + config.localFolder + '/' + config.localFile +
                '" "' + config.remoteFolder + '/' + config.remoteFile + '" -b';
  simpleCommand(command, callback);
});

gulp.task('start', 'Start SSM managed resources', gulpSequence('start1','start2'));
gulp.task('stop', 'Stop SSM managed resources', gulpSequence('stop2', 'stop1'));
