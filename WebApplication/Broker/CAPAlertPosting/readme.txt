MASAS Tools

For more information visit http://www.masas.ca

--
To use the sample application server server.py that is included install:
python version 2.6 or 2.7  http://www.python.org
cherrypy version 3.2  http://www.cherrypy.org

Then run server.py, modify the 6 html files to have the correct Hub, secret,
URI, and Entry/CAP values, and load http://localhost:8080/ into your web browser.

If you are going to build your own application server to host these html files,
review the example JSON request/response URLs provided by server.py that are
needed to populate the posting tool forms.  In order to provide Attachment
support, your application server will have to temporarily save the Attachments
and package them up for a multi-part POST, server.py has an example of
the possible functionality required.

--
ems-icons.zip contains the icons that are hosted on the MASAS servers at 
http://icon.masas-sics.ca for EMS specific symbology.  It is a combination of
the EMS symbology hierarchy of incident/resource/operations/other.

To use these icons locally, unzip and place in an accessible location.  Then 
modify the html files to change the location from icon.masas-sics.ca to the appropriate location.
