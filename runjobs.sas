/******************************************************************************* 
Danone Research
Developed at Danone Nutrica Research, Utrecht, Netherlands
******************************************************************************** 
Program: 
runjobs.sas

Author: 
John Hendrickx, Herman Ament

Description: 
Run a set of job files sequentially as secified in a dataset

Version history
Version 1.0, Repository save date 07DEC2018
26MAR2019
Added header
Removed commented out code for using CALL EXECUTE
Added a NOPRINT option to PROC SQL

********************************************************************************
Documentation:

********************************************************************************
Macros called:
LSAF API macros:
	%lsaf_getsubmissionstatus
	%lsaf_submitandpopulatewsjob
	%lsaf_submitjob
	%lsaf_submitworkspacejob
Internal macros:
	%RunAjob
External function style macros:
	%words

Developed under SAS version: 9.4M3 on LSAF 4.7
*******************************************************************************/
%macro RunJobs(pathin=&_progdir,data=,jobname=jobname,loc=workspace,populate=No,sleep=5); 

	%local proglist i currjob;

	%if not %SYSFUNC(fileexist(&pathin)) %then %do;
		%put ERROR: [%nrstr(%%)&sysmacroname] The PATHIN option [&=pathin] is incorrect;
		%return;
	%end;
	%if %length(&data) eq 0 %then %do;
		%put ERROR: [%nrstr(%%)&sysmacroname] No dataset specified;
		%return;
	%end;
	%if not %SYSFUNC(EXIST(&data,data)) %then %do;
		%put ERROR: [%nrstr(%%)&sysmacroname] Dataset &data does not exist;
		%return;
	%end;

	%let loc=%substr(%upcase(&loc),1,1);
	%let populate=%substr(%upcase(&populate),1,1);

	/* The LSAP API macros require the path without &_sasws_ */
	%let lsaf_path=%substr(&pathin,%length(&_sasws_)+1);

	proc sql noprint;
		select &jobname into :jbnms separated by '\'
		from &data
		where substr(&jobname,1,1) ne '*';
	quit;
	%*-- HA save options MPRINT;
	%local options;
	%let options = %sysfunc(getoption(mprint));
	options nomprint;   

	%do i=1 %to %words(&jbnms,delim=\);
		%RunAjob(%scan(&jbnms,&i,\));
	%end;

	%*-- HA restore options MPRINT;
	options &options;

%mend;

%macro RunAjob(currjob);

	%local JobId try_sleep increament;

	%if not %sysfunc(fileexist(&pathin/&currjob)) %then %do;
		%put WARNING [%nrstr(%%)&sysmacroname] This job [&=currjob] does not exist;
		%return;
	%end;

	%put ### Start: &currjob %sysfunc(date(), date9.) %sysfunc(time(),time8.2);
	%if &loc eq R %then %do; /* Submit in Repository */
		%lsaf_submitjob(lsaf_path=&lsaf_path/&currjob);
		%let JobId =&_lsafJobSubmissionId_;
	%end;

	%else %do; /* Submit in Workspace */
		%if &populate eq N %then %do; /* Just submit the jobs */
			%lsaf_submitworkspacejob(lsaf_path=&lsaf_path/&currjob);
			%let JobId=&_lsafWorkspaceJobSubmissionId_;
		%end;
		%else %do; /* Submit and populate */
			%lsaf_submitandpopulatewsjob(lsaf_path=&lsaf_path/&currjob, lsaf_userelativepaths=1);
			%let JobId=&_lsafPopulateWsJobSummissionId_;
		%end;
	%end;

	%if &_lsafRC_ ne 0 %then %return;

	%* HA initial sleep 0.5 seconds;
	%let try_sleep  = 0.5;
	%* HA incremene sleep .5 seconds;
	%let increament = 0.5;

	%TryAgain:    

	data _null_;
		%* HA sleep not longer than the &sleep;
		sleep = min(&try_sleep, &sleep.);
		/*--HA  Changed call sleep(&try_sleep,10); * default sleep upto 5 seconds; */
		call sleep(sleep /10, 1); * default sleep 5 seconds;
	run;

	%* HA increase sleep each  with .5 seconds;
	%let try_sleep=%sysevalf(&try_sleep+&increament.);

	%local options;
	%let options = %sysfunc(getoption(mprint));
	options nonotes;   

	%lsaf_getsubmissionstatus(lsaf_jobsubmission_id=&JobId);

	%*-- HA restore options MPRINT;
	options &options;

	/* %put %index(&_lsafJobSubmissionStatus_,%STR(COMPLETED));*/

	%if (%index(&_lsafJobSubmissionStatus_,%STR(COMPLETED))<=0) %then %goto TryAgain;
	%put ### End  :  &currjob %sysfunc(date(), date9.) %sysfunc(time(),time8.2);
	%put ### &currjob &=_lsafJobSubmissionStatus_;
	%put;
%mend;
