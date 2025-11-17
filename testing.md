# JMeter Load Testing Guide for Secure File Sharing Application

## Prerequisites

1. **Install Apache JMeter 5.4+**
   - Download from: https://jmeter.apache.org/download_jmeter.cgi
   - Extract and add to PATH

2. **Create Test Data Directory Structure**
   ```
   secure-file-sharing/
   ├── jmeter-tests/
   │   ├── test-plan.jmx (the XML file above)
   │   ├── test-files/
   │   │   ├── sample.txt
   │   │   ├── test-document.pdf
   │   │   └── image.jpg
   │   └── results/
   ```

3. **Create Sample Test Files**
   ```bash
   mkdir -p jmeter-tests/test-files
   echo "This is a test file for JMeter testing" > jmeter-tests/test-files/sample.txt
   ```

## Test Plan Configuration

### Variables to Update
- `BASE_URL`: Your backend server URL (default: http://192.168.73.1:3000)
- `CLIENT_URL`: Your frontend URL (default: http://localhost:3001)
- `TEST_EMAIL`: Valid test user email
- `TEST_PASSWORD`: Valid test user password
- `ADMIN_EMAIL`: Valid admin user email
- `ADMIN_PASSWORD`: Valid admin user password

### Test Scenarios

#### 1. User Authentication Tests (20 users, 5 loops)
- User Registration
- User Login with token extraction
- Profile retrieval

#### 2. File Upload Tests (15 users, 3 loops)
- File upload with authentication
- Get user uploads
- Revoke upload functionality

#### 3. File Download Tests (25 users, 2 loops)
- Download link verification
- File download simulation

#### 4. Admin Dashboard Tests (10 users, 5 loops)
- Admin authentication
- Dashboard statistics
- File management
- Audit logs
- CSV export
- Health checks

#### 5. Stress Test (100 users, 10 loops)
- Mixed random operations
- Concurrent load simulation

## Running the Tests

### Command Line Execution
```bash
# Navigate to JMeter installation directory
cd /path/to/jmeter/bin

# Run the test plan
./jmeter -n -t /path/to/secure-file-sharing/jmeter-tests/test-plan.jmx -l /path/to/results/test-results.jtl

# Generate HTML report
./jmeter -g /path/to/results/test-results.jtl -o /path/to/results/html-report/
```

### GUI Mode (for test development)
```bash
./jmeter -t /path/to/secure-file-sharing/jmeter-tests/test-plan.jmx
```

## Performance Metrics to Monitor

### Response Time Targets
- Authentication: < 1 second
- File Upload: < 5 seconds (depending on file size)
- Dashboard Load: < 2 seconds
- Database Queries: < 500ms

### Throughput Targets
- Login requests: 50 TPS
- File operations: 20 TPS
- Admin operations: 10 TPS

### Error Rate Targets
- Overall error rate: < 1%
- Authentication errors: < 0.5%
- File operation errors: < 2%

## Test Data Requirements

### User Accounts
Create test users in your database:
```sql
-- Test user
INSERT INTO users (email, password, role) VALUES 
('testuser@example.com', 'hashed_password', 'user');

-- Admin user
INSERT INTO users (email, password, role) VALUES 
('admin@example.com', 'hashed_password', 'admin');
```

### Test Files
- Small text file (< 1KB)
- Medium document (1-10MB)
- Large file (10-50MB) - for stress testing

## Monitoring During Tests

### System Resources
- CPU usage
- Memory consumption
- Disk I/O
- Network bandwidth

### Application Metrics
- Database connection pool
- API response times
- Error logs
- Security scan performance

### JMeter Listeners
- View Results Tree (debugging)
- Summary Report (overview)
- Aggregate Report (detailed metrics)
- Response Time Graph
- Throughput Graph

## Test Scenarios

### Load Testing
- Normal user load simulation
- Peak hour traffic patterns
- Sustained load over time

### Stress Testing
- Maximum user capacity
- Resource exhaustion points
- Recovery testing

### Security Testing
- Authentication bypass attempts
- File access permission tests
- Admin privilege escalation tests

## Cleanup After Tests

1. Remove test files from storage
2. Clean up test user accounts
3. Clear audit logs if needed
4. Reset any modified system settings

## Expected Results

### Performance Benchmarks
- 50 concurrent users: < 2s response time
- 100 concurrent users: < 5s response time
- 200+ concurrent users: Identify breaking point

### Reliability Metrics
- 99.9% uptime during normal load
- Graceful degradation under stress
- Proper error handling and recovery

## Troubleshooting

### Common Issues
1. **Connection refused**: Check if backend server is running
2. **Authentication failures**: Verify test credentials
3. **File upload errors**: Check file permissions and storage
4. **High response times**: Monitor system resources

### Debug Steps
1. Run single thread first
2. Check server logs
3. Monitor database performance
4. Verify network connectivity
5. Check JMeter logs for errors