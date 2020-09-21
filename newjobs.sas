/******************************************************************************* 
Danone Research
Developed at Danone Nutrica Research, Utrecht, Netherlands
******************************************************************************** 
Program: 
newjobs.sas

Author: 
John Hendrickx

Description: 
Create a job file for all SAS programs in a "programs" folder

Version history
08JUN2018
Original version
29OCT2018
Added header
Changed default for output files to "no versioning"
Fixed bug, macro would not detect existing job files

********************************************************************************
Documentation:

********************************************************************************
Macros called:
Internal macros:
	%MakeAjob
External macros:
	%listfiles

Developed under SAS version:
9.4M3 on LSAF 4.7.3
*******************************************************************************/
%macro NewJobs(pathin=&_progdir);
	/* Check whether the top directory is named "Job" */
	%let topdir=%scan(&pathin,-1,/);
	%if &topdir ne Job %then %do;
		%put ERROR: [%nrstr(%%)&sysmacroname] The top level directory must be a "Job" directory [&topdir];
		%return;
	%end;
	
	%let progdir=%substr(&pathin,1,%length(&pathin)-%length(&topdir)-1);
	%listfiles(pathin=&progdir,ext=sas,print=no,out=__SASfiles);
	
	data _null_;
		set __SASfiles;
		basename=substr(fname,1,length(fname)-4);
		call execute(cats('%MakeAjob(',basename,')'));
	run;
	
	proc sql;
		drop table __SASfiles;
	quit;
%mend;

%macro MakeAjob(fname);
	%if %SYSFUNC(fileexist(&pathin/&fname..job)) %then %return;
	data _null_;
		file "&pathin/&fname..job";
		put "<?xml version=""1.0"" encoding=""UTF-8""?>";
		put "<job releaseVersion=""1.0"" description="""" executionMode=""SEQUENTIAL"" sddVersion=""4.0"" log=""../Log/"" lst=""../Listing/"" mnf=""../Manifest/"">";
		put "  <tasks>";
		put "    <task path=""../&fname..sas"" />";
		put "  </tasks>";
		put "  <taskSpecs>";
		put "    <inputSpec path=""../&fname..sas"" type=""FILE"" version=""*"" includeSubFolders=""false"" />";
		put "  </taskSpecs>";
		put "  <otherSpecs />";
		put "  <outputPaths />";
		put "  <outputSpec enableVersioningForNewFiles=""false"">";
		put "    <versionType type=""MAJOR"" />";
		put "  </outputSpec>";
		put "  <parameters />";
		put "</job>";
        put " ";
	run;
%mend;
