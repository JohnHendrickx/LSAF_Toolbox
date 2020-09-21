/**********************************************************************
* SAS PROGRAM NAME  : words.sas                                       *
* DESCRIPTION       : Function type macro to return the number of     *
*                     space delimited words in a string               *
* CREATED BY        : JHendrickx                                      *
* DATE WRITTEN      : 24NOV2010                                       *
***********************************************************************
* CHANGES:                                                            *
* Version:  date:   Change made by:     Alteration:                   *
*                                                                     *
*                                                                     *
***********************************************************************
* TO USE THIS CODE FOR YOUR SAS PROGRAM, PERFORM THESE STEPS:         *
*     This code should be placed in a SAS autocall library            *
*     or read by an include statement in a SAS program                *
* This is a modified version of the %words macro by                   *
* Roland Rashleigh-Berry, available at                                *
* http://www.datasavantconsulting.com/roland                          *
*                                                                     *
* DESCRIPTION OF WHAT THE CODE EXPECTS FOR INPUT:                     *
*     str [mandatory]                                                 *
*         A string or macro variable that resolves to a string        *
*     delim [default=' ']                                             *
*         The default delimiter is a space                            *
* DESCRIPTION OF WHAT THE CODE WILL OUTPUT:                           *
*     The macro returns the number of words in the string, based upon *
*     the specified delimiter                                         *
***********************************************************************
* CODE VALIDATED BY: name                                             *
* CODE VALIDATION DATE: date                                          *
**********************************************************************/
%macro words(str,delim=%str( ));
	%sysfunc(countw(&str,&delim))
%mend;
