cd ../../

md tmp

md "tmp/sparkbridge"

xcopy sparkbridge "tmp/sparkbridge" /s /e /exclude:%cd%\sparkbridge\buildtool\pack.config

cd ./sparkbridge/buildtool

7za.exe a ../../tmp/sparkbridge.zip ../../tmp/sparkbridge/*

cd ../../tmp

REN sparkbridge.zip sparkbridge.llplugin