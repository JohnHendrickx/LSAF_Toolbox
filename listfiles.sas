%macro listfiles(pathin=&_progdir,ext=job,out=,print=Yes);
    %if not %SYSFUNC(fileexist(&pathin)) %then %do;
        %put ERROR: [%nrstr(%%)&sysmacroname] The PATHIN option [&=pathin]  isincorrect;
        %return;
    %end;

	filename _dir_ "&pathin";
	data __flist;
	   length fname $200;
	   did=dopen("_dir_");
	   numfiles=dnum(did);
	   do i=1 to numfiles;
	      fname=dread(did,i);
	      if scan(fname,-1,'.')="&ext" then output;
	   end;
	   rc=dclose(did);
	run;
	filename _dir_ clear;
	
	proc sort data=__flist;
		by fname;
	run;
	
	%if %substr(%upcase(&print),1,1) eq Y %then %do;
		proc print data=__flist noobs;
			var fname;
		run;
	%end;
	
	%if %length(&out) ne 0 %then %do;
		data &out;
			set __flist(keep=fname);
		run;
	%end;
	
	proc sql;
		drop table __flist;
	quit;
%mend;

