Create DB
1.  Create a DB
2.	Create tables using CreateTables.sql

Web Application Installation
1.	Copy all stuff in folder "WebApplication" to a place you expect to put this web application. We assume the path is <<PathOfApplication>>
2.	Create a web application in IIS with ASP.Net 4.0
3.	Set the virtual path of the web application to the directory <<PathOfApplication>> which you put the files of this web application.
4.	Open the file web.conf in <<PathOfApplication>>.Then fill follow variables according the xpath
	//configuration/appSettings/add[@key="WPSLink"]/@value
The URL of WPS for gain the upstream stations
	//configuration/appSettings/add[@key="WNSLink"]/@value
The url of WNS for send notifications
	//configuration/appSettings/add[@key="CSWLink"]/@value
The url of CSW for getting measure data
	//configuration/appSettings/add[@key="CapAlertSeed"]/@value
Url of CAP Alert Seed
	//configuration/connectionStrings/add[@name="WNSEntities"]/@connectionString
The connection string for Entity Client to connect to the DB created in according the section [Create DB]
	//configuration/log4net/appender[@name="RollingFile"]/file/@value
The place to create log file
	//configuration/system.net/mailSettings/smtp
Set SMTP server for sending mail




