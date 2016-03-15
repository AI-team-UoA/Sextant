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

import java.io.Serializable;

/**
 * This exception should be thrown by the server from an RPC call, when the client
 * has requested the server to communicate with an endpoint and that communication
 * is not possible (e.g., the endpoint is not operating at the given URL, or is not
 * responding, or the connection to the endpoint was closed unexpectedly).  
 *  
 * @author Charalampos Nikolaou <charnik@di.uoa.gr>
 */
public class EndpointCommunicationException extends Exception implements Serializable {

	private static final long serialVersionUID = 7093669292859620696L;

	public EndpointCommunicationException() {
	}

	public EndpointCommunicationException(String arg0) {
		super(arg0);
	}

	public EndpointCommunicationException(Throwable arg0) {
		super(arg0);
	}

	public EndpointCommunicationException(String arg0, Throwable arg1) {
		super(arg0, arg1);
	}
}
