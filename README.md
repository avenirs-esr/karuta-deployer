# karuta-deployer
gradle-war-deployer for karuta
embed deployed app on tomcat, like the tomcat-manager, psi-probe

## How to install

* customize tomcat path install `cp build.properties.sample build.properties` and edit `build.properties`
* run `./gradlew tomcatInstall` to
  *  unzip tomcat from offical sources
  *  deploy custom conf from `etc/tomcat/`
  *  copy karuta backend and filserver config from `etc/karuta/` into `$PROJECT_HOME` path (the default path is `$CATALINA_BASE/karuta` - this variable should be set with the same path of `$KARUTA_HOME` )
* run `./gradlew tomcatDeploy ` will deploy on tomcat webapps directory
  * `psi-probe` for tomcat overview and management
  * `karuta-backend`
  * `karuta-fileserver`
  * `karuta-frontend` (on `karuta`)
* run `./gradlew deployKarutaConfig` to deploy into tomcat webapps the `karuta-config` webapp from `etc/karuta-config/`
* customize your jvm env with such configuration example to adapt:

```
  export CATALINA_HOME=/opt/${user}/tomcat
  export CATALINA_BASE=/opt/${user}/tomcat
  export CATALINA_TMPDIR=$CATALINA_BASE/temp
  export CATALINA_PID=/opt/${user}/tomcat/uportal.pid
  export KARUTA_HOME=$CATALINA_BASE/karuta

  export JAVA_OPTS="$JAVA_OPTS -server -d64 -Xms2G -Xmx6G -XX:+UseG1GC -XX:+PrintCommandLineFlags -XX:+PrintFlagsFinal"
  export JAVA_OPTS="$JAVA_OPTS -Djava.net.preferIPv4Stack=true -Dnetworkaddress.cache.ttl=3600"
  export JAVA_OPTS="$JAVA_OPTS -Djava.awt.headless=true -Dcom.sun.management.jmxremote -Dhttps.protocols=TLSv1.2"
  export JAVA_OPTS="$JAVA_OPTS -Dhttp.agent=Java-Karuta"
  export JAVA_OPTS="$JAVA_OPTS -Dserver.webapps=/opt/${user}/webapps -Dserver.home=/opt/${user}/tomcat"
```
you can set this env conf into the `${karutaDeployerPath}/etc/tomcat/bin/setenv.sh` or in your script runing the tomcat start command.

NOTE: you can have a git repository to manage `karuta-backend_config` and `karuta-fileserver_config`, or have a NFS shared directory for all *_config + fileserver_data on which you apply snapshot save.


## Tomcat configuration

most important file to watch on is `etc/tomcat/server.xml`

* the connector configured by default is for proxy HTTP and not for AJP
* you can set the `<resource></resource>` to use a secured, managed, monitored from jmx JDBC pool. The default conf is nearly a good one for production
* accesslog valve is configured for a HAproxy frontend

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

    ProxyPass /karuta http://an_ip:8080/karuta
    # not needed expect for redirecting from inside
    #ProxyPassReverse / http://an_ip:8080/
</VirtualHost>
```

* HAproxy
```
backend bk_karuta

    option forwardfor

    redirect scheme https code 301 if !{ ssl_fc }

    http-request set-header X-Forwarded-Proto https if { ssl_fc }
    http-request set-header X-Forwarded-Port %[dst_port]

    server karuta AN_IP:8080
```
