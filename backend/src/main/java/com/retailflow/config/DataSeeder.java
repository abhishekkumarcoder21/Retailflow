package com.retailflow.config;

import com.retailflow.distributor.entity.Distributor;
import com.retailflow.distributor.repository.DistributorRepository;
import com.retailflow.inventory.entity.Inventory;
import com.retailflow.inventory.entity.InventoryMovement;
import com.retailflow.inventory.repository.InventoryMovementRepository;
import com.retailflow.inventory.repository.InventoryRepository;
import com.retailflow.order.entity.Order;
import com.retailflow.order.entity.OrderItem;
import com.retailflow.order.repository.OrderRepository;
import com.retailflow.organization.entity.Organization;
import com.retailflow.organization.repository.OrganizationRepository;
import com.retailflow.product.entity.Product;
import com.retailflow.product.repository.ProductRepository;
import com.retailflow.recommendation.service.RecommendationService;
import com.retailflow.retailer.entity.Retailer;
import com.retailflow.retailer.entity.RetailerAssignment;
import com.retailflow.retailer.repository.RetailerAssignmentRepository;
import com.retailflow.retailer.repository.RetailerRepository;
import com.retailflow.territory.entity.Territory;
import com.retailflow.territory.repository.TerritoryRepository;
import com.retailflow.user.entity.User;
import com.retailflow.user.repository.UserRepository;
import com.retailflow.visit.entity.Visit;
import com.retailflow.visit.repository.VisitRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Component
public class DataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private final OrganizationRepository organizationRepository;
    private final UserRepository userRepository;
    private final TerritoryRepository territoryRepository;
    private final DistributorRepository distributorRepository;
    private final RetailerRepository retailerRepository;
    private final RetailerAssignmentRepository assignmentRepository;
    private final ProductRepository productRepository;
    private final InventoryRepository inventoryRepository;
    private final InventoryMovementRepository movementRepository;
    private final OrderRepository orderRepository;
    private final VisitRepository visitRepository;
    private final RecommendationService recommendationService;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(
            OrganizationRepository organizationRepository,
            UserRepository userRepository,
            TerritoryRepository territoryRepository,
            DistributorRepository distributorRepository,
            RetailerRepository retailerRepository,
            RetailerAssignmentRepository assignmentRepository,
            ProductRepository productRepository,
            InventoryRepository inventoryRepository,
            InventoryMovementRepository movementRepository,
            OrderRepository orderRepository,
            VisitRepository visitRepository,
            RecommendationService recommendationService,
            PasswordEncoder passwordEncoder) {
        this.organizationRepository = organizationRepository;
        this.userRepository = userRepository;
        this.territoryRepository = territoryRepository;
        this.distributorRepository = distributorRepository;
        this.retailerRepository = retailerRepository;
        this.assignmentRepository = assignmentRepository;
        this.productRepository = productRepository;
        this.inventoryRepository = inventoryRepository;
        this.movementRepository = movementRepository;
        this.orderRepository = orderRepository;
        this.visitRepository = visitRepository;
        this.recommendationService = recommendationService;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (organizationRepository.count() > 0) {
            log.info("Database already contains data, skipping initial seeding.");
            return;
        }

        log.info("Starting deterministic demo data seeding for RetailFlow AI...");

        // 1. Organization
        Organization org = new Organization();
        org.setName("Apex FMCG Solutions");
        org.setSlug("apex-fmcg");
        org.setBusinessType("Consumer Packaged Goods");
        org.setAddress("452 Innovation Park, Cyber City, Gurugram, Haryana");
        org.setPhone("+91-124-4982000");
        org.setEmail("contact@apexfmcg.com");
        org.setStatus(Organization.OrganizationStatus.ACTIVE);
        org = organizationRepository.save(org);

        // 2. Users
        String encodedPassword = passwordEncoder.encode("Password123!");

        User admin = new User();
        admin.setOrganization(org);
        admin.setEmail("admin@retailflow.com");
        admin.setPasswordHash(encodedPassword);
        admin.setFirstName("Sarah");
        admin.setLastName("Jenkins");
        admin.setPhone("+91-9810012345");
        admin.setRole(User.Role.ADMIN);
        admin.setStatus(User.UserStatus.ACTIVE);
        admin = userRepository.save(admin);

        User salesRep1 = new User();
        salesRep1.setOrganization(org);
        salesRep1.setEmail("sales.rep@retailflow.com");
        salesRep1.setPasswordHash(encodedPassword);
        salesRep1.setFirstName("Marcus");
        salesRep1.setLastName("Vance");
        salesRep1.setPhone("+91-9810054321");
        salesRep1.setRole(User.Role.SALES_REP);
        salesRep1.setStatus(User.UserStatus.ACTIVE);
        salesRep1 = userRepository.save(salesRep1);

        User salesRep2 = new User();
        salesRep2.setOrganization(org);
        salesRep2.setEmail("elena.rostova@retailflow.com");
        salesRep2.setPasswordHash(encodedPassword);
        salesRep2.setFirstName("Elena");
        salesRep2.setLastName("Rostova");
        salesRep2.setPhone("+91-9810098765");
        salesRep2.setRole(User.Role.SALES_REP);
        salesRep2.setStatus(User.UserStatus.ACTIVE);
        salesRep2 = userRepository.save(salesRep2);

        User distributorUser = new User();
        distributorUser.setOrganization(org);
        distributorUser.setEmail("distributor@retailflow.com");
        distributorUser.setPasswordHash(encodedPassword);
        distributorUser.setFirstName("David");
        distributorUser.setLastName("Chen");
        distributorUser.setPhone("+91-9810067890");
        distributorUser.setRole(User.Role.DISTRIBUTOR);
        distributorUser.setStatus(User.UserStatus.ACTIVE);
        distributorUser = userRepository.save(distributorUser);

        // 3. Territories
        Territory tNorth = new Territory();
        tNorth.setOrganization(org);
        tNorth.setName("North Metro");
        tNorth.setDescription("Delhi NCR and Gurgaon retail district");
        tNorth.setRegion("Northern Zone");
        tNorth = territoryRepository.save(tNorth);

        Territory tWest = new Territory();
        tWest.setOrganization(org);
        tWest.setName("Western Corridors");
        tWest.setDescription("Mumbai and Pune industrial & retail corridor");
        tWest.setRegion("Western Zone");
        tWest = territoryRepository.save(tWest);

        Territory tSouth = new Territory();
        tSouth.setOrganization(org);
        tSouth.setName("Southern Hubs");
        tSouth.setDescription("Bengaluru, Chennai, and Hyderabad commercial centers");
        tSouth.setRegion("Southern Zone");
        tSouth = territoryRepository.save(tSouth);

        // 4. Distributor
        Distributor dist = new Distributor();
        dist.setOrganization(org);
        dist.setUser(distributorUser);
        dist.setName("Apex Metro Logistics & Distribution");
        dist.setContactPerson("David Chen");
        dist.setPhone("+91-9810067890");
        dist.setEmail("david.chen@apexlogistics.com");
        dist.setAddress("Plot 88, Udyog Vihar Phase 4, Gurugram");
        dist.setTerritory(tNorth);
        dist.setStatus(Distributor.DistributorStatus.ACTIVE);
        dist = distributorRepository.save(dist);

        // 5. Retailers
        Retailer r1 = createRetailer(org, tNorth, "SuperMart Express", "Ramesh Gupta", "+91-9871112233", "supermart@express.in", "Shop 12, Sector 14", "Gurugram", "Haryana", "122001");
        Retailer r2 = createRetailer(org, tNorth, "City Corner Grocery", "Anil Sharma", "+91-9872223344", "citycorner@gmail.com", "Plot 45, DLF Phase 1", "Gurugram", "Haryana", "122002");
        Retailer r3 = createRetailer(org, tNorth, "Metro Fresh Foods", "Pooja Verma", "+91-9873334455", "metrofresh@delhi.com", "Connaught Place, Block C", "New Delhi", "Delhi", "110001");
        Retailer r4 = createRetailer(org, tWest, "Evergreen Organics", "Sunil Deshmukh", "+91-9874445566", "evergreen@organics.in", "Bandra West, Hill Road", "Mumbai", "Maharashtra", "400050");
        Retailer r5 = createRetailer(org, tSouth, "Apex Daily Needs", "Karthik Subramanian", "+91-9875556677", "dailyneeds@koramangala.in", "80ft Road, Koramangala", "Bengaluru", "Karnataka", "560034");

        // Assign Sales Rep 1 to r1, r2, r3
        assignSalesRep(r1, salesRep1);
        assignSalesRep(r2, salesRep1);
        assignSalesRep(r3, salesRep1);

        // Assign Sales Rep 2 to r4, r5
        assignSalesRep(r4, salesRep2);
        assignSalesRep(r5, salesRep2);

        // 6. Products
        Product p1 = createProduct(org, "SKU-WHEAT-01", "Organic Whole Wheat Atta 5kg", "Staples & Grains", "100% stone ground whole wheat flour", "BAG", new BigDecimal("320.00"));
        Product p2 = createProduct(org, "SKU-OIL-02", "Cold-Pressed Mustard Oil 1L", "Cooking Essentials", "Kachi ghani cold-pressed mustard oil", "BOTTLE", new BigDecimal("195.00"));
        Product p3 = createProduct(org, "SKU-RICE-03", "Premium Aged Basmati Rice 5kg", "Staples & Grains", "Long-grain aged aromatic Basmati", "BAG", new BigDecimal("650.00"));
        Product p4 = createProduct(org, "SKU-TEA-04", "Artisanal Darjeeling Green Tea 250g", "Beverages", "Single-estate handpicked whole leaf tea", "PACK", new BigDecimal("280.00"));
        Product p5 = createProduct(org, "SKU-HONEY-05", "Pure Himalayan Wild Honey 500g", "Breakfast & Spreads", "Raw unpasteurized mountain honey", "JAR", new BigDecimal("420.00"));
        Product p6 = createProduct(org, "SKU-BARS-06", "Oatmeal Granola Snack Bars 6x40g", "Snacks", "Nutrient-rich almond and cranberry granola bars", "BOX", new BigDecimal("180.00"));

        // 7. Inventory for Distributor and Central Warehouse
        createInventoryRecord(org, p1, dist, 250, 20, admin);
        createInventoryRecord(org, p2, dist, 180, 25, admin);
        createInventoryRecord(org, p3, dist, 120, 15, admin);
        createInventoryRecord(org, p4, dist, 85, 10, admin);
        createInventoryRecord(org, p5, dist, 4, 15, admin); // LOW STOCK intentionally!
        createInventoryRecord(org, p6, dist, 300, 30, admin);

        // Central Warehouse Inventory (null distributor)
        createInventoryRecord(org, p1, null, 1500, 50, admin);
        createInventoryRecord(org, p2, null, 800, 40, admin);
        createInventoryRecord(org, p3, null, 950, 40, admin);
        createInventoryRecord(org, p4, null, 500, 20, admin);
        createInventoryRecord(org, p5, null, 250, 20, admin);
        createInventoryRecord(org, p6, null, 1200, 50, admin);

        // 8. Sample Historical Orders
        createSampleOrder(org, r1, salesRep1, dist, Order.OrderStatus.DELIVERED, "ORD-20261020-0001",
                List.of(new OrderItemSeed(p1, 10), new OrderItemSeed(p2, 12)), LocalDateTime.now().minusDays(7));

        createSampleOrder(org, r2, salesRep1, dist, Order.OrderStatus.PROCESSING, "ORD-20261024-0002",
                List.of(new OrderItemSeed(p3, 5), new OrderItemSeed(p4, 8), new OrderItemSeed(p6, 15)), LocalDateTime.now().minusDays(3));

        createSampleOrder(org, r3, salesRep1, dist, Order.OrderStatus.CONFIRMED, "ORD-20261027-0003",
                List.of(new OrderItemSeed(p1, 8), new OrderItemSeed(p2, 6), new OrderItemSeed(p4, 4)), LocalDateTime.now().minusHours(4));

        createSampleOrder(org, r4, salesRep2, null, Order.OrderStatus.DELIVERED, "ORD-20261022-0004",
                List.of(new OrderItemSeed(p4, 20), new OrderItemSeed(p5, 10)), LocalDateTime.now().minusDays(5));

        // 9. Visits
        createSampleVisit(org, r1, salesRep1, Visit.VisitStatus.COMPLETED,
                LocalDateTime.now().minusDays(2).withHour(11).withMinute(15),
                LocalDateTime.now().minusDays(2).withHour(12).withMinute(0),
                "Restocked shelf display, store manager requested additional inventory for festival season.", "ORDER_PLACED");

        createSampleVisit(org, r2, salesRep1, Visit.VisitStatus.COMPLETED,
                LocalDateTime.now().minusDays(1).withHour(14).withMinute(30),
                LocalDateTime.now().minusDays(1).withHour(15).withMinute(15),
                "Reviewed competitor pricing. Positive feedback on wheat flour quality.", "STOCK_CHECK");

        // 10. Generate initial recommendations
        recommendationService.refreshRecommendations(org.getId());

        log.info("RetailFlow AI demo data seeded successfully!");
        log.info("Admin login: admin@retailflow.com / Password123!");
        log.info("Sales Rep login: sales.rep@retailflow.com / Password123!");
        log.info("Distributor login: distributor@retailflow.com / Password123!");
    }

    private Retailer createRetailer(Organization org, Territory territory, String name, String owner, String phone, String email, String address, String city, String state, String zip) {
        Retailer r = new Retailer();
        r.setOrganization(org);
        r.setTerritory(territory);
        r.setBusinessName(name);
        r.setOwnerName(owner);
        r.setPhone(phone);
        r.setEmail(email);
        r.setAddress(address);
        r.setCity(city);
        r.setState(state);
        r.setPostalCode(zip);
        r.setStatus(Retailer.RetailerStatus.ACTIVE);
        return retailerRepository.save(r);
    }

    private void assignSalesRep(Retailer r, User rep) {
        RetailerAssignment assignment = new RetailerAssignment();
        assignment.setRetailer(r);
        assignment.setUser(rep);
        assignmentRepository.save(assignment);
    }

    private Product createProduct(Organization org, String sku, String name, String category, String description, String unit, BigDecimal price) {
        Product p = new Product();
        p.setOrganization(org);
        p.setSku(sku);
        p.setName(name);
        p.setCategory(category);
        p.setDescription(description);
        p.setUnit(unit);
        p.setBasePrice(price);
        p.setStatus(Product.ProductStatus.ACTIVE);
        return productRepository.save(p);
    }

    private void createInventoryRecord(Organization org, Product p, Distributor dist, int qty, int threshold, User actor) {
        Inventory inv = new Inventory();
        inv.setOrganization(org);
        inv.setProduct(p);
        inv.setDistributor(dist);
        inv.setQuantity(qty);
        inv.setLowStockThreshold(threshold);
        inv = inventoryRepository.save(inv);

        InventoryMovement movement = new InventoryMovement();
        movement.setOrganization(org);
        movement.setInventory(inv);
        movement.setProduct(p);
        movement.setMovementType(InventoryMovement.MovementType.STOCK_IN);
        movement.setPreviousQuantity(0);
        movement.setQuantityChange(qty);
        movement.setResultingQuantity(qty);
        movement.setReason("Initial stock opening balance");
        movement.setReferenceType("OPENING_BALANCE");
        movement.setActor(actor);
        movementRepository.save(movement);
    }

    private static class OrderItemSeed {
        final Product product;
        final int quantity;
        OrderItemSeed(Product product, int quantity) {
            this.product = product;
            this.quantity = quantity;
        }
    }

    private void createSampleOrder(Organization org, Retailer r, User rep, Distributor dist, Order.OrderStatus status, String orderNumber, List<OrderItemSeed> itemSeeds, LocalDateTime createdAt) {
        Order order = new Order();
        order.setOrganization(org);
        order.setRetailer(r);
        order.setSalesRep(rep);
        order.setDistributor(dist);
        order.setStatus(status);
        order.setOrderNumber(orderNumber);
        order.setCreatedAt(createdAt);

        BigDecimal subtotal = BigDecimal.ZERO;
        for (OrderItemSeed seed : itemSeeds) {
            BigDecimal lineTotal = seed.product.getBasePrice().multiply(BigDecimal.valueOf(seed.quantity));
            subtotal = subtotal.add(lineTotal);

            OrderItem item = new OrderItem();
            item.setProduct(seed.product);
            item.setProductName(seed.product.getName());
            item.setProductSku(seed.product.getSku());
            item.setQuantity(seed.quantity);
            item.setUnitPrice(seed.product.getBasePrice());
            item.setSubtotal(lineTotal);
            order.addItem(item);
        }

        order.setSubtotal(subtotal);
        order.setDiscountAmount(BigDecimal.ZERO);
        order.setTotalAmount(subtotal);
        orderRepository.save(order);
    }

    private void createSampleVisit(Organization org, Retailer r, User rep, Visit.VisitStatus status, LocalDateTime in, LocalDateTime out, String notes, String outcome) {
        Visit v = new Visit();
        v.setOrganization(org);
        v.setRetailer(r);
        v.setUser(rep);
        v.setStatus(status);
        v.setCheckInTime(in);
        v.setCheckOutTime(out);
        v.setNotes(notes);
        v.setOutcome(outcome);
        v.setLatitude(28.4595);
        v.setLongitude(77.0266);
        visitRepository.save(v);
    }
}
