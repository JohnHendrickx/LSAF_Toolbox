/*******************************************************************************
                             Danone Nutricia Research
********************************************************************************
Program         : SAS scripts.js
Author          : John Hendrickx
Purpose         : Scripts ported from PSPad for use with SAS
- SASlogCheck:    Check the current log file for errors, warnings, notes
- SASlogCheckAll: Check all SAS logs in the directory of the curren log file
- OpenLog:        Open the SAS log of the current SAS program 
- LSAF_job:       Create a job file for the current SAS program
Remarks         : 
********************************************************************************
Change log:
29JAN2019
Version for Notepad++, based on version 23NOV2016 for PSPad
17JUL2020
Harmonized NoteCheck() with %_check_logs
*******************************************************************************/
(function(){
	var sas_menu = Editor.addMenu("SAS");

	// From "Zen Coding.js"
	function addMenuItem(name, action, menu, keystroke) {

		var menu_obj = {
			text: name + (keystroke ? '\t' + keystroke : ''),
			cmd: function() {
				eval(action)();
			},
			ctrl: false,
			alt: false,
			shift: false
		};
		
		if (keystroke) {
			var keys = keystroke.split('+');
			for (var i = 0, il = keys.length; i < il; i++) {
				var key = keys[i].toLowerCase();
				if (key.substring(0,1)=="f") {
					var key=111+parseInt(key.substring(1));
				}
				switch (key) {
					case 'shift':
					case 'alt':
					case 'ctrl':
						menu_obj[key] = true;
						break;
					default:
						menu_obj.key = key;
				}
			}
			
			addHotKey(menu_obj);
		}
		
		eval(menu+".addItem(menu_obj)");
	}


	// init engine
	addMenuItem('Check SAS log', 'SASlogCheck', 'sas_menu', 'Ctrl+Alt+L');
	addMenuItem('Check all SAS logs in directory', 'SASlogCheckAll', 'sas_menu');
	addMenuItem('Create LSAF job file', 'LSAF_job', 'sas_menu');
	addMenuItem('Open SAS log file', 'OpenLog', 'sas_menu', 'Alt+Shift+L');
	addMenuItem('Switch Workspace/Repository file', 'OpenRepoWork', 'sas_menu', 'Alt+Shift+R');

	addMenuItem("Report Data Sets", "ReportDataSets2Clip", 'sas_menu');
	addMenuItem("Report Macros", "ReportAllMacros2Clip", 'sas_menu');
	addMenuItem('Leading Spaces To Tabs', 'LeadingSpacesToTabs', 'sas_menu');
	addMenuItem('Tabs To leading Spaces', 'TabsToleadingSpaces', 'sas_menu');

	sas_menu.addSeparator();
	
	addMenuItem("Nutricia header", "Nutricia_header","sas_menu","Ctrl+Shift+F6");
	var insert_menu = sas_menu.addMenu("Insert");
	addMenuItem("Insert date", "ins_date","insert_menu","Ctrl+Shift+D");
	addMenuItem("Insert file name", "ins_fn","insert_menu","Ctrl+Shift+N");
	addMenuItem("Insert basename", "ins_basename","insert_menu","Ctrl+Alt+B");
	addMenuItem("Insert directory", "ins_dir","insert_menu","Ctrl+Alt+N");
	addMenuItem("Insert file path", "ins_path","insert_menu","Ctrl+Alt+P");
	
	function LeadingSpacesToTabs() {
		var fname=Editor.currentView.files[Editor.currentView.file];
		var alltxt = Editor.currentView.text;
		Dialog.prompt("Number of leading spaces to convert to a tab", "3", function(x){
			// Need to use the RegExp function to include calculated values
			// Need to use the 'g' (global) and 'm' multiline functions because the entire
			// text is read as variable alltxt		
			var re=RegExp('^[ ]{'+5*x+'}(\\S)','gm');
			alltxt=alltxt.replace(re,"\t\t\t\t\t$1");
			var re=RegExp('^[ ]{'+4*x+'}(\\S)','gm');
			alltxt=alltxt.replace(re,"\t\t\t\t$1");
			var re=RegExp('^[ ]{'+3*x+'}(\\S)','gm');
			alltxt=alltxt.replace(re,"\t\t\t$1");
			var re=RegExp('^[ ]{'+2*x+'}(\\S)','gm');
			alltxt=alltxt.replace(re,"\t\t$1");
			var re=RegExp('^[ ]{'+1*x+'}(\\S)','gm');
			alltxt=alltxt.replace(re,"\t$1");
			alltxt=alltxt.replace(/^[ ]+$/gm,"");
			Editor.currentView.text=alltxt;
		});
	}

	// https://medium.freecodecamp.org/three-ways-to-repeat-a-string-in-javascript-2a9053b93a2d
	// The repeat method " ".repeat(4) does not work
	function repeatStringNumTimes(string, times) {
		var repeatedString = "";
		while (times > 0) {
			repeatedString += string;
			times--;
		}
		return repeatedString;
	}

	function TabsToleadingSpaces() {
		var fname=Editor.currentView.files[Editor.currentView.file];
		var alltxt = Editor.currentView.text;
		Dialog.prompt("Number of spaces per leading tab", "4", function(x){
			// Need to use the RegExp function to include calculated values
			// Need to use the 'g' (global) and 'm' multiline functions because the entire
			// text is read as variable alltxt	
			alltxt=alltxt.replace(/^\t{5}(\S)/gm,repeatStringNumTimes(" ",5*x)+"$1");
			alltxt=alltxt.replace(/^\t{4}(\S)/gm,repeatStringNumTimes(" ",4*x)+"$1");
			alltxt=alltxt.replace(/^\t{3}(\S)/gm,repeatStringNumTimes(" ",3*x)+"$1");
			alltxt=alltxt.replace(/^\t{2}(\S)/gm,repeatStringNumTimes(" ",2*x)+"$1");
			alltxt=alltxt.replace(/^\t{1}(\S)/gm,repeatStringNumTimes(" ",1*x)+"$1");
			alltxt=alltxt.replace(/^\s+$/gm,"");
			Editor.currentView.text=alltxt;
		});
	}
	
	function uniq_fast(a) {
		var seen = {};
		var out = [];
		var len = a.length;
		var j = 0;
		for(var i = 0; i < len; i++) {
			 var item = a[i][2];
			 if(seen[item] !== 1) {
				   seen[item] = 1;
				   out[j++] = a[i];
			 }
		}
		return out;
	}

	// Derived from Dialog.js
	// Creates a clickable window with log errors, warnings, notes
	// Click the first header to copy the log to a new file
	// Click one of the other headers to delete duplicates (in column 3)
	function outputToDialogGrid(filepath,messages){

		var dialCfg = new Dialog.Grid({
			title:filepath,
			css:"#head td{text-align: left; font-family: Sans-serif; font-weight: bold;}; body{font-family: Monospace}; i.warning{ background-position:-16px 0;} i.warning,i.error{width:16px; height:16px; background-repeat: no-repeat; background-image: URL(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAQCAYAAAB3AH1ZAAAAAXNSR0IArs4c6QAAAAZiS0dEAP8A/wD/oL2nkwAAAAlwSFlzAAALEwAACxMBAJqcGAAABOtJREFUSMe1lFtsVGUQx3/zfefs2XN2l25b1ra0dqEtLQ1CUVJRlAApjddQjGg0Jj6oiQmXqEFj4oPigxGiRAM8eHsxUSNCYor64IUYIyFAQwoFbexFKKYV2tKL2+6lu3s+HxbxQtEn53Fm/jO/b+bLwL/YJ044/pHtVPE/mlwr8Dro+1fefM7PpDIHTpyufx78/yp24t5gDFgPrAOagTgwAHQA3wAHl3+eHvmrxrpWsbk6/Mj87fOqSE9RdV/PA+Qz+/6teWdbsAXYGqlf2hZetpZgfCk6Wk5u4kLtzEBXbeLktw8lerraO9uCe25sTx/6Q6dnK7YTAq3LV3xXOm88gCSInpvTWvHr6K6vrzGFUxudFivk7Sq5adXqktZHcePL0G4IwaCDIQJlNbjxhWg/tSg7ebHpyXrT+9aP+bMAaraC86zYc7VPl4dH3+jAf/UU128vKqrU3ubZck8/7MSUzdY5DUuawstbEMsif6kHbQve4la0LeQu9SCWRXh5C3MaljQpm62nH3ZiswLsAG/FyqUvpt8+gNq8n8Rjn8KBo6y7uWrHDiT4z3wrYNaH43VtXvVCSA7jDx7GjB5DsmOFT5Ydg9Fj+IOHITmMV72QcLyuzQqY9bMCxJ2yN2uf8QJDJwwlz26k6NkNZD6D617KO9W298rVAKxzyioxk71IegiVHcBiBDNxqpCQ7MdiBJUdQNJDmMlenLJKrADrrgLYiRTf3rroCX9fB8b86R/LAC/0c1eDfupVpOivGu2YZjvkItP9qKkuLBlG62FU5ofCBNLdaD2MJcOoqS5kuh875KId03wVwEJ33sdV66flYl+aSKDgM0A6CeYCRNckdV3AfvdvE3BMXHsu2rPR/lmUdQllj0HuNGQnIXcGZY+hrHG0f7aQ57lYjon/DWAXUr/2jopW/6t+ihsjxGb+PBQxBThAV457brA3bofqKwBBBkTl0SEbFbFQ9hgS/A1xJ8kdr0Ws80jwN5Q9iopY6JCNqDxWkIErAK+BLCmK7Ys+lpLshI935BcsC0aiwkhUCJeBeMAQuK0z0mSpD66sIGA6MCl0eSNSMh+8HLgppPIurNtGUTWbwE2Bl0NK5qPLG8GkCro/ACJirV3zYOky83I3TuckRIAiiE4YiicM2BR8Cjie4+4bA6t2IrdeXsE3pM6jShuQaD0SroCQBufycAMCIY2EK5BoPaq0AVLnCzrA2g32koj1od3ZDeeABUCxC6kUdk8fRD2YAxRHIDMNQ4ZA6wzLuuT9lzNmkeVwkMSZdn+kqk3V34IJXIfY4xg6yQ2WAWVQugGTLYaZGH7PUVTiTLtyOAgg+7V6fEOl/55lA3OBuIYFHtTVwGBf4RUNi6H3HPSNQ28WbMjnhHeO6Ec2kftoeq+04BTtUjW3N+m6lYinwVagBfIGsj4mmSffdwT/58OnyExuC20xhwCsklBRLLttbzY9lUcXBxA7KBJ1DI4rUhMCX5ncVFKkIYGpSBvTnDL+eB4Z+8lUnthdQyZBaIs5lHpnchv9X2z1U7+0SWUjEosjXjEmOY4ZGcAMdsNQV7uCPe7l5gDysWK1Rh4QY5IWIhpjlEjhDogRDL4PykfMDJgcyEwh6iYNX2yCL4EgULJ6AXXP3MOdi6tpnhuh0Q1QnprhwmiC7h/O07F9P9+fvMgAMAxMALnfARodxAmP18qUAAAAAElFTkSuQmCC)}",
			header:["-","Line","Text"],
			rows:messages,
			dockable:{name:"Checking: ",docking:"bottom"},
			onHeaderClick:function(cell, target){
				// alert(this.rows);
				// alert(this.header[cell.cellIndex]);
				// Copy the results to a new text window if the first header is clicked
				var currMessages=this.rows;
				if (this.header[cell.cellIndex] == "-") {
					MenuCmds.FILE_NEW();
					var currMessagesText = currMessages.map(function(value,index) { return value[2]; });
					Editor.currentView.selection=currMessagesText.join("\n");
				}
				// If a different header is clicked then remove duplicates in column 3
				else {
					var newMessages=uniq_fast(currMessages);
					outputToDialogGrid(filepath,newMessages)
				}
			},
			onRowClick:function(cell, target){
				// alert("r: "+this.rows[cell.parentNode.rowIndex][cell.cellIndex]);
				// alert(this.rows[cell.parentNode.rowIndex][1]);
				Editor.currentView.lines.current=this.rows[cell.parentNode.rowIndex][1]-1;
				// activate view
				MenuCmds.VIEW_SWITCHTO_OTHER_VIEW();
				if (this.view != Editor.currentView)
					MenuCmds.VIEW_SWITCHTO_OTHER_VIEW();
			}
		});
		var d = new Dialog(dialCfg);

	}

	// From "tests.menu.js"
	// Replaces logwindow in PSPad
	function outputToDockedWindow(text){
		var w = Editor.createDockable({onbeforeclose:function(){ 
				return false;
			}});
		var d = w.document;
		
		d.write("<html><head></head><body><pre>"+text+"</pre></body></html>");
		d.close();
		delete d;
	}	
	
	// Called by SASlogCheck and SASlocCheckAll.doCheck
	// Returns "true" if a line starts with INFO or starts with NOTE and has other relevant 
	// text, or contains error or warning but does not start with these words (in uppercase)
	function NoteCheck(textline) {
		var foundText = false;
		if (/^NOTE|^INFO/.test(textline)) {
			if ( 
				(/invalid/i.test(textline)) ||
				(/has been truncated/i.test(textline)) ||
				(/never been refere/i.test(textline)) ||
				(/division by zero/i.test(textline)) ||
				(/is not in the report def/i.test(textline)) ||
				(/not resolved/i.test(textline)) ||
				(/uninitialized/i.test(textline)) ||
				(/mathematical operations could not/i.test(textline)) ||
				(/extraneous information/i.test(textline)) ||
				(/defaulted/i.test(textline)) ||
				(/will be overwritten/i.test(textline)) ||
				(/The quoted string currently being processed/i.test(textline)) ||
				(/not referenced/i.test(textline)) ||
				(/were 0 observations read/i.test(textline)) ||
				(/repeats of by values/i.test(textline)) ||
				(/current word or quoted string has become more/i.test(textline)) ||
				(/outside the axis range/i.test(textline)) ||
				(/is unknown/i.test(textline)) ||
				(/was not found, but appears on a delete/i.test(textline)) ||
				(/outside the axis range/i.test(textline)) ||
				(/cartesian/i.test(textline)) ||
				(/closing/i.test(textline)) ||
				(/w.d format/i.test(textline)) ||
				(/cannot be determined/i.test(textline)) ||
				(/could not be loaded/i.test(textline)) ||
				(/matrix is not positive definite/i.test(textline)) ||
				(/could not be written because it has the same name/i.test(textline)) ||
				(/meaning of an identifier after a quoted string/i.test(textline)) ||
				(/this may cause NOTE: No observations in data set/i.test(textline)) ||
				(/variable will not be included on any output data set/i.test(textline)) ||
				(/a number has become too large at/i.test(textline)) ||
				(/box contents truncated/i.test(textline)) ||
				(/exists on an input data set/i.test(textline)) ||
				(/is not in the report def/i.test(textline)) ||
				(/is unknown/i.test(textline)) ||
				(/lost card/i.test(textline)) ||
				(/unable to find the/i.test(textline)) ||
				(/have been converted to/i.test(textline)) ||
				(/sas went to a new line when/i.test(textline))			
			) foundText = true;
		}
		return(foundText);
	}

	function SASlogCheck() {
		var logname=Editor.currentView.files[Editor.currentView.file];
		
	 	if (!/\.log$/i.test(logname)) return;
		var firstlog=0;

		var fso = new ActiveXObject("Scripting.FileSystemObject");
		var thisfile=fso.GetFile(logname);
			
		var filecnt=thisfile.OpenAsTextStream(1, -2); // for reading, using system default for unicode/ascii
		var currline, LogLine;
		var matches = [];
		while (!filecnt.AtEndOfStream) {
			currline=filecnt.readline();
			// Report all errors, warnings or INFO statements
			LogLine=(/^ERROR|^WARNING/.test(currline));
			if (NoteCheck(currline)) LogLine = true;
		
			if (LogLine) {
				var linenr=filecnt.Line-1;
				if (firstlog == 0) firstlog = linenr;
				if (/^ERROR/.test(currline)) matches.push(["<i class='error'/>",linenr,currline]);
				else if (/^WARNING/.test(currline)) matches.push(["<i class='warning'/>",linenr,currline]);
				else matches.push(["",linenr,currline]);
				
			}
		} // end of for-loop
		
		if (firstlog == 0) matches.push(["",1,"[No errors, warnings, or relevant notes]"]);
		outputToDialogGrid(thisfile.Name,matches)
		filecnt.close();	
	}
	//------------------------------------------------------------------------
	// Start of SASlocCheckAll section
	//------------------------------------------------------------------------
	function SASlogCheckAll() {
		var fullPath = Editor.currentView.files[Editor.currentView.file];
		//Editor.alert(fullPath);
		var dir=fullPath.replace(/\\[^\\]+$/, "");
		// Editor.alert(dir);
		// Editor.alert(errFile);

		var fso = new ActiveXObject("Scripting.FileSystemObject");
		errFile = fso.CreateTextFile(dir+"\\log_errors.txt", true);
		warnFile = fso.CreateTextFile(dir+"\\log_warnings.txt", true);
		noteFile = fso.CreateTextFile(dir+"\\log_notes.txt", true);	

		f = fso.GetFolder(dir);
		fc = new Enumerator(f.files);
		var currfile
		for (; !fc.atEnd(); fc.moveNext()) {
			if (!/\.log$/i.test(fc.item())) continue;
			currfile=fso.GetFile(fc.item());
			doCheck(currfile);
		}
		errFile.close();
		warnFile.close();
		noteFile.close();
		Editor.open(dir+"\\log_errors.txt");
		Editor.open(dir+"\\log_warnings.txt");
		Editor.open(dir+"\\log_notes.txt");
		// Editor.alert("Done!");

	}
	
	function doCheck(thisfile) {
		// Editor.alert(thisfile);
		var errorfree=1;
		var warningfree=1;
		var notefree=1;
		var filecnt=thisfile.OpenAsTextStream(1, -2); // for reading, using system default for unicode/ascii
		var currline, linenr;
		while (!filecnt.AtEndOfStream) {
			currline=filecnt.readline();
			if (/^ERROR/.test(currline)) {
				linenr=filecnt.Line-1;
				if (errorfree) {
					print_prog_name(thisfile.Name,errFile);
					errorfree=0;
				}
				errFile.WriteLine(padnum(linenr)+" "+currline);
			}
			if (/^WARNING/.test(currline)) {
				linenr=filecnt.Line-1;
				if (warningfree) {
					print_prog_name(thisfile.Name,warnFile);
					warningfree=0;
				}
				warnFile.WriteLine(padnum(linenr)+" "+currline);
			}
			if (NoteCheck(currline))  {
				linenr=filecnt.Line-1;
				if (notefree) {
					print_prog_name(thisfile.Name,noteFile);
					notefree=0;
				}
				noteFile.WriteLine(padnum(linenr)+" "+currline);
			}
		}
		filecnt.Close();
	}

	function print_prog_name(logname,dest) {
		var log=logname;
		var re=/^([^\.]*)\.log$/i;
		var progname=log.replace(re,"$1.sas");
		dest.WriteLine("\n########################################################");
		dest.WriteLine("### PROGRAM: "+progname);
		dest.WriteLine("########################################################\n");
	}
	
	function padnum(n) {
		var numstr='      ' + n.toString();
		return numstr.substr(numstr.length-6);
	}
	//------------------------------------------------------------------------
	// Start of LSAF_job section
	//------------------------------------------------------------------------
	function LSAF_job() {
		var fname = Editor.currentView.files[Editor.currentView.file];

		if (!(/\.sas$/i.test(fname))) {
			Editor.alert("Use this script with a SAS file")
			return
		}
		var dir=fname.replace(/\\[^\\]+$/, "");
		var basename=fname.replace(/^.+\\(.+)\..+$/, "$1");
		// Editor.alert(basename)
		
		var fso = new ActiveXObject("Scripting.FileSystemObject");
		if (!fso.FolderExists(dir+"\\Job\\")) {
			Editor.alert("No Job subfolder found")
			return
		}	
		if (!fso.FolderExists(dir+"\\Log\\")) {
			Editor.alert("No Log subfolder found")
			return
		}	
		if (!fso.FolderExists(dir+"\\Listing\\")) {
			Editor.alert("No Listing subfolder found")
			return
		}	
		if (!fso.FolderExists(dir+"\\Manifest\\")) {
			Editor.alert("No Manifest subfolder found")
			return
		}	
		// Check if the file already exists
		if (fso.FileExists(dir+"\\Job\\"+basename+".job")) {
			Editor.alert("Job file \""+basename+".job\" already exists\nDelete the current job file and rerun this script")
			return
		}	
		var jobfile=fso.CreateTextFile(dir+"\\Job\\"+basename+".job", true);

		jobfile.WriteLine("<?xml version=\"1.0\" encoding=\"UTF-8\"?>");
		jobfile.WriteLine("<job releaseVersion=\"1.0\" description=\"\" executionMode=\"SEQUENTIAL\" sddVersion=\"4.0\" log=\"../Log/\" lst=\"../Listing/\" mnf=\"../Manifest/\">");
		jobfile.WriteLine("  <tasks>");
		jobfile.WriteLine("    <task path=\"../"+basename+".sas\" />");
		jobfile.WriteLine("  </tasks>");
		jobfile.WriteLine("  <taskSpecs>");
		jobfile.WriteLine("    <inputSpec path=\"../"+basename+".sas\" type=\"FILE\" version=\"*\" includeSubFolders=\"false\" />");
		jobfile.WriteLine("  </taskSpecs>");
		jobfile.WriteLine("  <otherSpecs />");
		jobfile.WriteLine("  <outputPaths />");
		jobfile.WriteLine("  <outputSpec enableVersioningForNewFiles=\"false\">");
		jobfile.WriteLine("    <versionType type=\"MAJOR\" />");
		jobfile.WriteLine("  </outputSpec>");
		jobfile.WriteLine("  <parameters />");
		jobfile.WriteLine("</job>");
		jobfile.close();
		Editor.alert("Job file\n"+basename+".job\nCreated")
	}
	//------------------------------------------------------------------------
	// Start of OpenLog section
	//------------------------------------------------------------------------
	function OpenLog() {
		var fname=Editor.currentView.files[Editor.currentView.file];
		if (!(/\.sas$/i.test(fname))) {
			Editor.alert("Use OpenLog to open the log for a SAS files")
			return
		}

		var fso = new ActiveXObject("Scripting.FileSystemObject");

		var re=/\.sas$/i;
		logfile=fname.replace(re,".log");
	// 	Editor.alert(logfile);

	//	Test whether "Log" is a subfolder of the current folder
		var LogPath=logfile.substring(0,logfile.lastIndexOf("\\")+1);
		var LogName=logfile.substring(logfile.lastIndexOf("\\")+1);
		if (fso.FolderExists(LogPath+"Log\\")) {
			logfile=LogPath+"Log\\"+LogName
		}	
		// Editor.alert(logfile);

		var qtab=out_index(logfile);
		// Editor.alert(qtab)
		
		if (qtab==-1) {
			if (fso.FileExists(logfile)) {
				Editor.open(logfile);
			}
			else {
				Editor.alert("Can't open log file "+logfile)
			}
		}
		else {
			Editor.open(Editor.currentView.files[qtab])
		}
	}

	// Open the workspace/repository counterpart of the file
	function OpenRepoWork() {
		var fname=Editor.currentView.files[Editor.currentView.file];
		if (!(/^(R:\\|U:\\)/i.test(fname))) {
			Editor.alert("Use "+this+" only with SDD Desktop Connection using drive letters R: and U:")
			return
		}

		var fso = new ActiveXObject("Scripting.FileSystemObject");

		if ((/^R:\\/i.test(fname))) {
			var re=/^R:\\/i;
			var fnameOther=fname.replace(re,"U:\\");
		}
		else if ((/^U:\\/i.test(fname))) {
			var re=/^U:\\/i;
			var fnameOther=fname.replace(re,"R:\\");
		}
		// alert(fnameOther)

		if (fso.FileExists(fnameOther)) {
			Editor.open(fnameOther);
		}

	}

	function out_index(name) {
		for(var i=0,fs=currentView.files.length; i<fs; i++){
			if (Editor.currentView.files[i]==name) return(i);
		}
		return(-1);
	}
	//------------------------------------------------------------------------
	// Start of Nutricia header section
	//------------------------------------------------------------------------
	function getFN(str) {
		return str.split('\\').pop().split('/').pop()
	}
	
	function ins_date() {
		Editor.currentView.selection=date9();
	}

	function ins_path() {
		Editor.currentView.selection=Editor.currentView.files[Editor.currentView.file] ;
	}

	function ins_fn() {
		var fname=Editor.currentView.files[Editor.currentView.file];
		Editor.currentView.selection=getFN(fname);
	}
	
	function ins_dir() {
		var fullPath = Editor.currentView.files[Editor.currentView.file];
		//Editor.alert(fullPath);
		Editor.currentView.selection=fullPath.replace(/\\[^\\]+$/, "");
	}

	function ins_basename() {
		var filepath=Editor.currentView.files[Editor.currentView.file];
		var filename=getFN(filepath);
		var re=/^([^\.]*)\.\w+$/i;
		var filename2=filename.replace(re,"$1");

		Editor.currentView.selection=filename2;
	}

	function Nutricia_header() {
		var fname=Editor.currentView.files[Editor.currentView.file];
		var alltxt = Editor.currentView.text;
		// alert(getFN(fname))

		Editor.currentView.lines.current=0;
		if (/\.sas$/i.test(fname)) Nutricia_SAS_header(alltxt,fname)
		else if (/\.r$/i.test(fname)) Nutricia_R_header(alltxt)
	}

	function Nutricia_SAS_header(alltxt,fname) {
		// search for a Nutricia header
		var re=/\/\*[\s\S]*?Danone Nutricia Research[\s\S]*?\*\//i;
		var headr=re.exec(alltxt);
		if (headr==null) {
			newhead=insertNewSASheader();
		}
		else {
			var headstart=re.lastIndex;
			Editor.currentView.pos=headstart;
			newhead=headr[0]
		};
		
		var newhead2=updateSASheader(newhead,fname);
		Editor.currentView.selection=newhead2; 
	}


	function updateSASheader(instr,fname) {
		var re, newstr, user;
		var user=GetDisplayName();
		var user = user.replace(/^([^,]+), (.*)$/g, "$2 $1");
		var protocol=GetProtocol();
		
		re=/\t/g;
		newstr=instr.replace(re,"    ");
		
		re=/(PROGRAM NAME:[ ]{3}).*\n/;
		newstr=newstr.replace(re,"$1"+getFN(fname)+"\n");
		re=/(CREATED BY:[ ]{5})(.*)\n/;
		var tmp=re.exec(newstr);
		if (RegExp.$2.trim( )=="") newstr=newstr.replace(re,"$1"+user+"\n");
		if (protocol.length > 0) {
			re=/(STUDY\/PROJECT:[ ]{2})(.*)\n/;
			newstr=newstr.replace(re,"$1"+protocol+"\n");
		}
		
		re=/[\n\r][ ]+[\n\r]/g;
		newstr=newstr.replace(re,"\n\n");
		re=/[\n\r]{2,}/g;
		newstr=newstr.replace(re,"\n");
		
		return(newstr);
	}

	String.prototype.trim = function() {
		return this.replace(/^\s+/,'').replace(/\s+$/,'');
	}

	function insertNewSASheader() {
	var emptyHead=
		"/*******************************************************************************\n"+
		"                             Danone Nutricia Research\n"+
		"********************************************************************************\n"+
		"PROGRAM NAME:   \n"+
		"PURPOSE:        \n"+
		"STUDY/PROJECT:  \n"+
		"CREATED BY:     \n"+
		"--------------------------------------------------------------------------------\n"+
		"NOTES:          \n"+
		"--------------------------------------------------------------------------------\n"+
		"CHANGE LOG:\n"+
		"*******************************************************************************/\n";
		return(emptyHead);
	}

	function GetDisplayName() {
		var objSysInfo  = new ActiveXObject("ADSystemInfo");
		var oUser= GetObject("LDAP://" + objSysInfo.UserName + "");
		return(oUser.displayname);
	}

	function GetProtocol() {
		var fso = new ActiveXObject("Scripting.FileSystemObject");
		var thisfile=Editor.currentView.files[Editor.currentView.file];
		var subdirs=thisfile.split ("\\");
		for (i = 0; i < subdirs.length; i++) {
			if (fso.FileExists(subdirs.slice(0,i).join("\\")+"\\protocol.txt")) {
				var protocolFile=fso.GetFile(subdirs.slice(0,i).join("\\")+"\\protocol.txt");		
				var protocolText=protocolFile.OpenAsTextStream(1, -2); // for reading, using system default for unicode/ascii
				var rslt=protocolText.readline();
				return(rslt);
				protocolText.Close;
			}
		}
		return("");	
	}

	function ReportDataSetsNew() {
		var alltxt = Editor.currentView.text;
			
		//Delete comments and macros from the text
		var alltxt2=noComments(alltxt);

		var mtch=new Array();
		/*var re=/(data\s*=|set\s|merge\s|from\s)\s*(\w+)\.(\w+)/ig;*/
		// use [\s\S] to match anything, including newlines, for a multiline search
		// use *? for a non-greedy search, i.e. match the first ";" occurrence
		// Match any text following data=, merge, set, from up to the next semicolon
		var re=/(data|set|merge|from)[\s\S]*?;/ig;
		mtch=alltxt2.match(re);
	// 	logaddline(mtch);
		
		if (mtch==null) return("");
		
		// Extract the permanent dataset names as word1.word2, where "word"x can
		// contain letters, numbers or an underscore
		// Store the results (if any) in array mtch2
		var mtch2=new Array();
		var tmp=new Array();
		for (var i=0; i<mtch.length; i++) {
			tmp=mtch[i].match(/(\w+)\.(\w+)/g);
			if (tmp!=null) mtch2.push(tmp);
		}
		
		if (mtch2==null) return("");
		
		// mtch2 will be a two-dimensional array. Convert to string and back to 
		// an array so it's one-dimensional. It needs to be an array to remove
		// duplicates
		var mtchtmp=mtch2.toString();
		var mtch3=mtchtmp.split(',');
		
		// Remove duplicates, convert to string and return the result
		var mtch3=RemoveDuplicates(mtch3);
		var mtchstr=mtch3.toString();
		
		return(mtchstr);
	}

	function date9() {
		var today = new Date();
		var d="0"+today.getDate();
		var dd=d.substr(d.length-2);
			
		var monthname=new Array("JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG",
			"SEP","OCT","NOV","DEC");
		var mmm=monthname[today.getMonth()];

		var date9=dd+mmm+today.getFullYear();
		return(date9);
	}

	//http://www.eggheadcafe.com/community/aspnet/3/10007603/remove-duplicates.aspx
	function RemoveDuplicates(arr) {
		// sort the array, return without duplicates.
		arr=arr.sort(function(x,y){ 
			var a = String(x).toUpperCase(); 
			var b = String(y).toUpperCase(); 
			if (a > b) 
				return 1 
			if (a < b) 
				return -1 
			return 0; 
		}); 
		var result=new Array();
		var lastValue="";
		var curValue;
		for (var i=0; i<arr.length; i++) {
			curValue=arr[i];
			if (curValue.toUpperCase() != lastValue.toUpperCase()) {
				result[result.length] = curValue;
			}
			lastValue=curValue;
		}
		return(result);
	}

	function noMacrosComments(instring) {
		// use [\s\S] to match anything, including newlines, for a multiline search
		// use *? for a non-greedy search, i.e. match the first "*/" occurrence
		// First remove all multiline comments /* ... */
		var re=/\/\*[\s\S]*?\*\//ig;
		var nocomm=instring.replace(re,"");
		
		// remove all single line comments
		var re=/(^|\s+)\*[\s\S]*?;/ig;
		var nocomm2=nocomm.replace(re,"");
		
		// remove all in-file macro specifications
		var re=/%macro[\s\S]*?%mend[\s\S]*?;/ig;
		var nocomm3=nocomm2.replace(re,"");
		return(nocomm3);
	}

	function noComments(instring) {
		// use [\s\S] to match anything, including newlines, for a multiline search
		// use *? for a non-greedy search, i.e. match the first "*/" occurrence
		// First remove all multiline comments /* ... */
		var re=/\/\*[\s\S]*?\*\//ig;
		var nocomm=instring.replace(re,"");
		
		// remove all single line comments
		var re=/(^|\s+)\*[\s\S]*?;/ig;
		var nocomm2=nocomm.replace(re,"");
		return(nocomm2);
	}

	function ReportMacros(everywhere) {
		var alltxt = Editor.currentView.text;
		var alltxt2;
		
		//Delete comments from the text
		//Delete comments and macros from the text
		if (everywhere) alltxt2=noComments(alltxt);
		else alltxt2=noMacrosComments(alltxt);
		
		var alltxt3=noMacroLabels(alltxt2);
		
		// search for all macro sytnax
		var re=/%\w+/ig;
		var mtch=new Array();
		mtch=alltxt3.match(re);
	// 	logaddline(mtch);
		if (mtch==null) return("");
		
		// sort and remove duplicates
		var mtch2=RemoveDuplicates(mtch);
	// 	logaddline(mtch2);

		// transform to string, remove builtin macro words that can be used outside
		// a macro
		var mtchstr=mtch2.toString();
	// 	logaddline(mtchstr);
		var rmv=/%(eval|global|q?left|length|let|q?lowcase|inc(lude)?|put|(nr)?b?quote|q?scan|(nr)?q?str|q?substrn?|superq|q?sysfunc|q?trim|q?upcase)($|,)/ig;
		var mtchstr2=mtchstr.replace(rmv,"");
	// 	logaddline(mtchstr2);
		var rmv2=/%(by|do|else|end|goto|if|index|length|let|local|macro|mend|put|return|symdel|symexist|symglobl|sysevalf|then|to|while|unquote|until)($|,)/ig;
		var mtchstr3=mtchstr2.replace(rmv2,"");
		var mtchstr4=mtchstr3.replace(/,$/,"");
		return(mtchstr4);
	}

	function noMacroLabels(instring) {
		// use [\s\S] to match anything, including newlines, for a multiline search
		// use *? for a non-greedy search, i.e. match the first "*/" occurrence
		// remove all macro labels (e.g. %exit:)
		var re=/%\w+?:/ig;
		var nomaclab=instring.replace(re,"");
		
		return(nomaclab);
	}
	
	function ReportAllMacros2Clip() {
		var macs=ReportMacros(1);
		clipBoard = macs;
		outputToDockedWindow(macs);
	}
	
	function ReportDataSets2Clip() {
		var dsets=ReportDataSetsNew();
		clipBoard = dsets;
		outputToDockedWindow(dsets);
	}

})()