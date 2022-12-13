# karuta-deployer
gradle-war-deployer for karuta
embed deployed app on tomcat, like the tomcat-manager, psi-probe

## Requirements
* run with java 8

## How to install

* customize tomcat path install `cp build.properties.sample build.properties` and edit `build.properties`
* run `./gradlew tomcatInstall` to
  *  unzip tomcat from offical sources
  *  deploy custom conf from `etc/tomcat/` - this task call the `tomcatConfig` task that could be used for deploying only a new tomcat conf on an existing tomcat
  *  copy karuta backend and filserver config from `etc/karuta/` into `$PROJECT_HOME` path.
     * the default path use `$CATALINA_BASE` if set, or `server.base` property from `build.properties`
     * this variable will be overriden by `$KARUTA_HOME` if set
     * if no `$KARUTA_HOME` is set, this can be overriden by `project.home` property from `build.properties` or passed in argument of all gradle commands
     * WARNING:  `etc/karuta/` path is defined from `appName` property into `gradle.property`, don't modify it !
* run `./gradlew tomcatDeploy --refresh-dependencies` will deploy on tomcat webapps directory
  * `psi-probe` for tomcat overview and management
  * `karuta-backend`
  * `karuta-fileserver`
  * `karuta-frontend` (on `karuta`)
* run `./gradlew deployKarutaConfig` to deploy into tomcat webapps the `karuta-config` webapp from `etc/karuta-config/`
* customize your jvm env with a such configuration example to adapt:

```
  # check user environment variable is set or replace the user name
  export CATALINA_HOME=/opt/${USER}/tomcat
  export CATALINA_BASE=/opt/${USER}/tomcat
  export CATALINA_TMPDIR=$CATALINA_BASE/temp
  export CATALINA_PID=/opt/${USER}/tomcat/karuta.pid
  export KARUTA_HOME=$CATALINA_BASE/karuta

  export CATALINA_OPTS="$CATALINA_OPTS -server -d64 -Xms2G -Xmx6G -XX:+UseG1GC -XX:+PrintCommandLineFlags -XX:+PrintFlagsFinal"
  export CATALINA_OPTS="$CATALINA_OPTS -Djava.net.preferIPv4Stack=true -Dnetworkaddress.cache.ttl=3600"
  export CATALINA_OPTS="$CATALINA_OPTS -Djava.awt.headless=true -Dcom.sun.management.jmxremote -Dhttps.protocols=TLSv1.2,TLSv1.3"
  export CATALINA_OPTS="$CATALINA_OPTS -Dhttp.agent=Java-Karuta"
  export CATALINA_OPTS="$CATALINA_OPTS -Dserver.webapps=/opt/${USER}/webapps -Dserver.home=/opt/${USER}/tomcat"

  # to enable JMX - must be modified depending on context
  # export CATALINA_OPTS="$CATALINA_OPTS -Dcom.sun.management.jmxremote.port=7777 -Dcom.sun.management.jmxremote.authenticate=false -Dcom.sun.management.jmxremote.ssl=false"

  # to enable java remote debug
  # export JPDA_ADDRESS=6665
  # export JPDA_TRANSPORT=dt_socket

```
you can set this env conf into the `${karutaDeployerPath}/etc/tomcat/bin/setenv.sh` or in your script runing the tomcat start command.

NOTE 1: you can have a git repository to manage `karuta-backend_config` and `karuta-fileserver_config`, or have a NFS shared directory for all *_config + fileserver_data on which you apply snapshot save.

NOTE 2: you can set `KARUTA_REPORT_FOLDER` environnement viariable to customize the folder where log reports will be produced.


## Database init:
  **The database should be created first with required grants for the server where is deployed Karuta. For that you can use the sql script etc/database/karuta-account.sql as example**


Following provide all commands that you should run from the project (it's an example on what can be done):

1. `mysql -h${sql.server.host} -u ${user} -p ${password} ${database} < etc/database/karuta-backend-func.sql`
2. `mysql -h${sql.server.host} -u ${user} -p ${password} ${database} < etc/database/karuta-backend.sql`
3. `mysql -h${sql.server.host} -u ${user} -p ${password} ${database} < etc/database/report-helper.sql`

## Tomcat configuration

most important file to watch on is `etc/tomcat/server.xml`

* the connector configured by default is for proxy HTTP and not for AJP
* you can set the `<resource></resource>` to use a secured, managed, monitored from jmx JDBC pool. The default conf is nearly a good one for production
* accesslog valve is configured for a HAproxy frontend

## Frontal configuration

WARNINNG: don't expose to public the `/karuta-fileserver` context

Following example of proxy http configurations on a frontal server
* apache

```

  <VirtualHost *:443>
    ...
    # SSL stuff
    ...
    # required arguments for proxying app
    RequestHeader set X-Forwarded-Proto "https"
    RequestHeader set X-Forwarded-Port "443"
    ProxyPreserveHost On

    ProxyPass /karuta/ http://an_ip:8080/karuta/
    ProxyPass /karuta-backend http://an_ip:8080/karuta-backend
    # not needed expect for redirecting from inside
    #ProxyPassReverse / http://an_ip:8080/
</VirtualHost>
```

* HAproxy
```
frontend https-in
  bind PUBLIC_IP ssl .....

...
  acl acl_uri_karuta path -i /karuta
  acl acl_uri_karuta path_beg -i /karuta/ /karuta-backend/ /karuta-config/
...
  use_backend bk_karuta if acl_uri_karuta



backend bk_karuta

    option forwardfor

    redirect scheme https code 301 if !{ ssl_fc }

    http-request set-header X-Forwarded-Proto https if { ssl_fc }
    http-request set-header X-Forwarded-Port %[dst_port]

    server karuta AN_IP:8080
```

## Run and init

`./gradlew tomcatStart`

Connect to the karuta app and import zip into `etc/model/` in the order of file names.