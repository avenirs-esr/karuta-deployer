# karuta-deployer

gradle-war-deployer for karuta
embed deployed app on tomcat, like the tomcat-manager, psi-probe

**[The documentation for installation and migration details please read the wiki](https://github.com/avenirs-esr/karuta-deployer/wiki)**

Following are only additional informations for the project
- [karuta-deployer](#karuta-deployer)
  - [Requirements](#requirements)
  - [How to install](#how-to-install)
    - [Deployment](#deployment)
    - [Database init](#database-init)
    - [Tomcat configuration](#tomcat-configuration)
    - [Reverse proxy configuration](#reverse-proxy-configuration)
    - [Run and init](#run-and-init)
  - [Optional: Exporting some pages as a PDF file and traces as a ZIP file](#optional-exporting-some-pages-as-a-pdf-file-and-traces-as-a-zip-file)
  - [Upgrades](#upgrades)
    - [General case](#general-case)
    - [Database Migration](#database-migration)

## Requirements

**run with java 11 minimum**

## How to install

### Deployment

- customize tomcat path install `cp build.properties.sample build.properties` and edit `build.properties`
- run `./gradlew tomcatInstall` to
  - unzip tomcat from offical sources
  - deploy custom conf from `etc/tomcat/` - this task call the `tomcatConfig` task that could be used for deploying only a new tomcat conf on an existing tomcat
  - copy karuta backend and filserver config from `etc/karuta/` into `$PROJECT_HOME` path.
    - the default path use `$CATALINA_BASE` if set, or `server.base` property from `build.properties`
    - this variable will be overriden by `$KARUTA_HOME` if set
    - if no `$KARUTA_HOME` is set, this can be overriden by `project.home` property from `build.properties` or passed in argument of all gradle commands
    - WARNING:  `etc/karuta/` path is defined from `appName` property into `gradle.properties`, don't modify it !
- run `./gradlew tomcatDeploy --refresh-dependencies` will deploy on tomcat webapps directory
  - `psi-probe` for tomcat overview and management
  - `karuta-backend`
  - `karuta-fileserver`
  - `karuta-frontend` (on `karuta`)
- run `./gradlew deployKarutaConfig` to deploy into tomcat webapps the `karuta-config` webapp from `etc/karuta-config/`
- customize your jvm env with a such configuration example to adapt:

** You should set jvm env variables **

You can set the env conf into the `${karutaDeployerPath}/etc/tomcat/bin/setenv.sh` or in your script runing the tomcat start command.

NOTE 1: You can have a git repository to manage `karuta-backend_config` and `karuta-fileserver_config`, or have a NFS shared directory for all *_config + fileserver_data on which you apply snapshot save.

NOTE 2: You can set `KARUTA_REPORT_FOLDER` environnement variable to customize the folder where log reports will be produced.

### Database init

**The database should be created first with required grants for the server where is deployed Karuta. For that you can use the sql script etc/database/karuta-account.sql as example.**

NB: The database should be tuned with this conf:

  - create custom file for mariadb 10.5 on debian 11 like `/etc/mysql/mariadb.conf.d/51-custom.cnf`
  - edit and add the content

```conf
[mariadb]
tmp_memory_table_size=2G
max_heap_table_size=2G
```

Following provide all commands that you should run from the project (it's an example on what can be done):

1. `mysql -h${sql.server.host} -u ${user} -p ${password} ${database} < etc/database/karuta-backend-func.sql`
2. `mysql -h${sql.server.host} -u ${user} -p ${password} ${database} < etc/database/karuta-backend.sql`
3. `mysql -h${sql.server.host} -u ${user} -p ${password} ${database} < etc/database/report-helper.sql`

### Tomcat configuration

Most important file to watch on is `etc/tomcat/server.xml`:
  - the connector configured by default is for proxy HTTP and not for AJP
  - you can set the `<resource></resource>` to use a secured, managed, monitored from jmx JDBC pool. The default conf is nearly a good one for production
  - accesslog valve is configured for a HAproxy frontend

### Reverse proxy configuration

You should set a proxy http configurations on a frontal server


### Run and init

`./gradlew tomcatStart`

Connect to the Karuta app and import the ZIP files that are into `etc/model/` in the order of file names (a number provide the order to import).

## Optional: Exporting some pages as a PDF file and traces as a ZIP file

You can also import two optional files (JS and CSS) from the `etc/model/optional-export/` folder. These files are used to enable the printing functionality of certain pages and the export of traces into a ZIP file.
This allows you to print (or export to PDF):

- Each page in "Mes formations actuelles et leurs référentiels"
- Each page in "Mes formations passées"
- Each page in "Mon référentiel de compétences personnalisées"
- The page "Mes traces"
- Each page in "Mes SAé"
- Each page in "Mes stages et alternances"
- Each page in "Mes autres actions"
- The page "Tableau de bord de mes compétences par formation"
- The page "Tableau de bord compétences personnalisées"
- Each page of "Compétences personnalisées (partie Bilan)"
- Each page of "Bilans par compétences de la formation"

This also allows you to export all the traces on the "Mes traces" page into a ZIP file. The name of the ZIP archive can be configured with the `exportTraceZipPrefix` property.

To inject the files, you need to import the print.js file into `KARUTA-Configuration > KARUTA - CONFIGURATION - TECH > Fichiers Javascript > Ajouter un fichier JS`, then follow the same principle for the print.scss file by going to the `Instructions CSS et fichiers CSS` section.

## Upgrades

**Before any upgrade, consider to make:**
1. a dump of the database
2. a backup of the fileserver data (path from $KARUTA_HOME/karuta-fileserver_data/)

### General case

For most case you should only do some git command updates to upgrade the karuta-deployer which permit to upgrade all karuta's apps. But see all docs indicated, or watch around commit change on this project for more actions during upgrade process.

```shell
# save local change and sync remote repositories
git stash && git fetch --all
# Checkout the version of your choice
git checkout -b v1.0.8 v1.0.8 
# re-apply local changes
git stash --apply
# watch all files properties for changes (_init.js, configKaruta.properties)
./gradlew tomcatInstall
./gradlew tomcatDeploy
./gradlew deployKarutaConfig
```

### Database Migration

- When migrating from kapc1.2 or 1.3.x, apply :
  - `mysql -h${sql.server.host} -u ${user} -p ${password} ${database} -e "DROP TABLE vector_table;"`
  - `mysql -h${sql.server.host} -u ${user} -p ${password} ${database} < etc/database/report-helper.sql`

- ~~When migrating from kapc 1.3, apply also such change on database:~~
  - ~~make dump of database, apply `sed -e 's/^) ENGINE=MyISAM/) ENGINE=InnoDB/'` on file and import dump - warning fonctions (routines) should be dumped too, or you will need to import `etc/database/karuta-backend-func.sql`~~
