# Custom JMeter Properties for Secure File Sharing Tests

# Increase timeout for file uploads
httpclient.timeout=30000

# Set larger buffer for file operations
httpsampler.max_buffer_size=65536

# Enable detailed logging
log_level.jmeter=DEBUG
log_level.jmeter.engine=DEBUG

# Performance settings
jmeter.save.saveservice.output_format=xml
jmeter.save.saveservice.response_data=false
jmeter.save.saveservice.samplerData=false

# Security settings
jmeter.security.acceptUntrustedCerts=true