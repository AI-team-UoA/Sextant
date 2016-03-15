/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * 
 * Copyright (C) 2012, 2013 Pyravlos Team
 * 
 * http://www.sextant.di.uoa.gr/
 */
package server;

import java.util.MissingResourceException;
import java.util.ResourceBundle;

/**
 * 
 * @author Charalampos Nikolaou <charnik@di.uoa.gr>
 */

public class ServerConfiguration {
	private static final String BUNDLE_NAME = "server.server-configuration";

	private static final ResourceBundle RESOURCE_BUNDLE = ResourceBundle.getBundle(BUNDLE_NAME);

	private ServerConfiguration() {
	}

	public static String getString(String key) {
		try {
			return RESOURCE_BUNDLE.getString(key);
		} catch (MissingResourceException e) {
			return '!' + key + '!';
		}
	}
	
	public static String getDataset(String dataset, String key) {
		
		String datasetName = "server." + dataset ;
		ResourceBundle datasetBundle = ResourceBundle.getBundle(datasetName);
		
		try {
			return datasetBundle.getString(key);
		} catch (MissingResourceException e) {
			return '!' + key + '!';
		}
	}
}
