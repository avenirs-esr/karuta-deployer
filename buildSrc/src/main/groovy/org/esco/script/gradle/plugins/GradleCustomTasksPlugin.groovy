package org.esco.script.gradle.plugins

import org.gradle.api.Plugin
import org.gradle.api.Project

class GradleCustomTasksPlugin implements Plugin<Project> {
    @Override
    void apply(Project project) {
        project.task('initDirCache') {
            group 'custom'
            description 'Create the shared cache directory'
            dependsOn project.rootProject.tasks.projectProperties

            doFirst {
                logger.lifecycle("Check if shared cache directory already exist, else will create it !");
                String cacheDir = project.rootProject.ext['buildProperties'].getProperty('server.sharedCacheDir')
                logger.lifecycle("Shared Cache Directory properties defined on path '${cacheDir}'");
                File dir = new File((String)cacheDir);
                if (!dir.exists()) {
                    logger.lifecycle("Shared cache directory not already existing, will create it '${cacheDir}'");
                    dir.mkdir();
                }
            }
        }
        project.tasks.tomcatDeploy.dependsOn 'initDirCache'

    }
}