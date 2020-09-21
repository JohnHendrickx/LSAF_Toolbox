# LSAF_Toolbox
Utilities for programming in LSAF (SAS Life Sciences Analytics Framework)

This repository contains some handy tools for programming in LSAF. 

Note that some of these utilities are dependent on the directory structure use at Danone Nutricia Research. It is assumed that there are separate subdirector below the directory containing SAS programs named:

* Job
* Listing
* Log
* Manifest

In addition, the SAS scripts for Notepad++ assume that a desktop connections have been created as R: for the repository and U: for the workspace. Modify the files as appropriate for your way of working.

## SAS scripts
`SAS scripts.js` contains useful scripts for working with SAS files in Notepad++. These scripts require the jN plugin for Notepad++. Copy `SAS scripts.js` to the `plugins\jN\jN\includes` subdirectory for Notepad++. A "SAS" menu will be present the next time Notepad++ is started.

## listfiles
`listfiles.sas` is a SAS macro for obtaining a list of files. %listfiles uses SAS I/O functions for LSAF and other situations where shell commands are not allowed.

## newjobs
`newjobs.sas` is a SAS macro for creating new, empty job files for any SAS programs for which there is currently no job file. The macro assumes it is being run from the "Job" subdirectory. Modify the macro as applicable.

The `pathin` parameter should point to the program location. The default value of `&_progdir` can be derived as

``` SAS
%let _progpath=&_SASWS_.&_SASFILEPATH_;
```

## runjobs
`runjobs.sas` is a SAS macro for running a set of SAS jobs sequentially. There are options to run the job files either in the repository or the workspace. If jobs are run in the workspace then "run and populate" can be used as well. %runjobs is intended to be run from the "Job" older in the workspace.

### Options
<dl>
  <dt><strong>pathin</strong></dt>
  <dd>The program directory. The default value is `&_progdir` which is undefined outside the Nutrica LSAF environment. This can be derived as `%let _progpath=&_SASWS_.&_SASFILEPATH_;` </dd>
  <dt><strong>data</strong></dt>
  <dd>A SAS dataset with a single variable `jobname` containing the names of the SAS job files to be run. Any job file prefixed by an asterisk will be ignored</dd>
  <dt><strong>loc</strong></dt>
    <dd>
      * Use `loc=workspace` to run the jobs in the workspace
      * Use `loc=repository` to run the jobs in the repository
    </dd>
</dl>
    
``` SAS
/*******************************************************************************
                             Danone Nutricia Research
********************************************************************************
PROGRAM NAME:   Run Jobs.sas
PURPOSE:        Run a list of jobs in the specified order
STUDY/PROJECT:  
CREATED BY:     HENDRICKX John
DATE COMPLETED: 26OCT2018
--------------------------------------------------------------------------------
NOTES:          This program is intended to be copied to a "Job" subfolder of a
programs folder *in the workspace*

* Run %newjobs interactively to create job files for any new SAS programs
* Run %listfiles interactively as a preparation for using %RunJobs. %Listfiles
will write a list of the SAS programs in the programs folder to the listing
in LSAF. Copy this list to the datalines section of the "runjobs" dataset.
Sort or delete entries as appropriate. Add an asterisk in front of a dataset
to temporarily ignore it.
* Run %runjobs to execute the jobs as listed in dataset "runjobs". 
- Use the option "populate=yes" to run the jobs in the workspace using "run and
populate"
- Use the option "loc=repository" to run the jobs in the repository. This 
program can nevertheless be in the workspace!
--------------------------------------------------------------------------------
CHANGE LOG:
*******************************************************************************/
%let _progpath=&_SASWS_.&_SASFILEPATH_;

/* Run %newjobs to create job files for new SAS programs */
/*
%newjobs;
*/
/* Run %listfiles for a list of all job files */
/*
%listfiles;
*/
/* Run the job files in this dataset in this order */
data runjobs;
input jobname $char100.;
infile datalines truncover;
datalines;
;
run;

/* Turn mprint off, the results for LSAF API macros are uninformative */
options nomprint;
%RunJobs(data=runjobs,populate=yes);
```
